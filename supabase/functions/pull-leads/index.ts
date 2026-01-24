import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Active Connectors
    const { data: connectors, error: connectorError } = await supabase
      .from('connectors')
      .select('*')
      .eq('status', 'active');

    if (connectorError) throw connectorError;

    if (!connectors || connectors.length === 0) {
       return new Response(
        JSON.stringify({ message: "No active connectors found." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    // 2. Iterate and Pull
    for (const connector of connectors) {
      const fetchedLeads = await pullLeadsFromConnector(connector);
      
      let createdCount = 0;
      let updatedCount = 0;

      for (const lead of fetchedLeads) {
        const result = await ingestLead(supabase, lead, connector.platform_name);
        if (result.action === 'created') createdCount++;
        if (result.action === 'updated') updatedCount++;
      }

      // 3. Update Connector `last_fetched_at`
      await supabase
        .from('connectors')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', connector.id);
        
      results.push({
         platform: connector.platform_name,
         created: createdCount,
         updated: updatedCount
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Mock Pull Function
async function pullLeadsFromConnector(connector: any) {
    // Simulate fetching data based on platform
    console.log(`Pulling from ${connector.platform_name}...`);
    
    // MOCK DATA
    const mockLeads = [
        {
            name: `Mock Lead ${Math.floor(Math.random() * 1000)}`,
            email: `mock${Math.floor(Math.random() * 1000)}@example.com`,
            phone: `555-${Math.floor(Math.random() * 10000)}`,
            source: connector.platform_name,
            status: 'New',
            notes: 'Pulled from connector'
        },
        {
            // Occasionally return a duplicate to test dedup (use a fixed phone/email if possible, or random)
            name: "Jane Doe (Duplicate Test)",
            email: "jane.doe@example.com", 
            phone: "555-0123",
            source: connector.platform_name
        }
    ];
    
    return mockLeads;
}

// Reused Ingestion Logic
async function ingestLead(supabase: any, payload: any, source: string) {
    const normalizedPhone = payload.phone?.trim() || null;
    const normalizedEmail = payload.email?.toLowerCase().trim() || null;
    const normalizedName = payload.name.trim();

    let existingLead = null;

    if (normalizedPhone) {
        const { data } = await supabase.from('leads').select('*').eq('phone', normalizedPhone).maybeSingle();
        if (data) existingLead = data;
    }

    if (!existingLead && normalizedEmail) {
         const { data } = await supabase.from('leads').select('*').eq('email', normalizedEmail).maybeSingle();
        if (data) existingLead = data;
    }

    if (existingLead) {
        const newNote = `Lead pulled again from ${source}`;
        // Verify we aren't spamming notes if nothing changed? User requirements say "Append to notes: New enquiry received..."
        // I'll stick to requirement.
        
        const updatedNotes = existingLead.notes 
            ? `${existingLead.notes}\n\n[${new Date().toISOString()}] ${newNote}` 
            : `[${new Date().toISOString()}] ${newNote}`;
            
        const { data } = await supabase
            .from('leads')
            .update({ 
                notes: updatedNotes,
                updated_at: new Date().toISOString() 
            })
            .eq('id', existingLead.id)
            .select()
            .single();
            
        return { action: 'updated', lead: data };
    } else {
        const { data } = await supabase
            .from('leads')
            .insert({
                name: normalizedName,
                phone: normalizedPhone,
                email: normalizedEmail,
                source: source,
                status: "New",
                metadata: payload.metadata || {},
                notes: payload.notes || null,
                assigned_to: null,
                next_follow_up_date: null
            })
            .select()
            .single();
            
        return { action: 'created', lead: data };
    }
}
