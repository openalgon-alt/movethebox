
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';
import crypto from 'crypto';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
    try {
        console.log('--- MoveTheBox Admin Promoter ---');

        // 1. Get Credentials
        let supabaseUrl = process.env.SUPABASE_URL || process.env.DB_HOST;
        let serviceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
            console.log('\n[!] Supabase URL not found in .env (or invalid).');
            supabaseUrl = await question('Enter Supabase URL (e.g., https://xyz.supabase.co): ');
        }

        if (!serviceKey || serviceKey === 'your_service_role_secret_key') {
            console.log('\n[!] Supabase Service Key not found in .env.');
            serviceKey = await question('Enter Supabase Service Role Key: ');
        }

        if (!supabaseUrl || !serviceKey) {
            console.error('Error: Credentials are required to proceed.');
            process.exit(1);
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        // 2. Get User Details
        let email = process.argv[2];
        if (!email) {
            email = await question('\nEnter User Email to Promote: ');
        }

        if (!email) {
            console.error('Email is required.');
            return;
        }

        // 3. Find User & Current State
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Error listing users: ${listError.message}`);
        }

        const user = users.find(u => u.email === email);

        if (!user) {
            console.error(`\n❌ User with email ${email} not found in Supabase Auth.`);
            console.log('Please sign up the user via the app first.');
            return;
        }

        console.log(`\nFound User: ${user.email}`);
        console.log(`Current Role: ${user.user_metadata?.role || 'None'}`);
        console.log(`Current Tenant: ${user.user_metadata?.tenant_id || 'None'}`);

        // 4. Determine Tenant ID
        let tenantId = process.argv[3];

        if (!tenantId) {
            if (user.user_metadata?.tenant_id) {
                const keep = await question(`\nKeep existing Tenant ID (${user.user_metadata.tenant_id})? (Y/n): `);
                if (keep.toLowerCase() === 'n') {
                    // Ask for change
                    const choice = await question('Assign new Tenant? \n  [1] Generate New (New Organization) \n  [2] Enter ID manually \n  [3] Skip/Clear \nSelection: ');
                    if (choice === '1') tenantId = crypto.randomUUID();
                    if (choice === '2') tenantId = await question('Enter Tenant ID: ');
                } else {
                    tenantId = user.user_metadata.tenant_id;
                }
            } else {
                // No existing tenant
                const choice = await question('\nAssign Tenant ID? \n  [1] Generate New (New Organization) \n  [2] Enter Existing ID (Join Organization) \n  [3] Skip \nSelection: ');
                if (choice === '1') tenantId = crypto.randomUUID();
                if (choice === '2') tenantId = await question('Enter Tenant ID: ');
                // Mock ID for easy setup if they hit enter?
                if (!tenantId && choice !== '3') {
                    // Default fallback? No, better to be explicit.
                }
            }
        }

        // 5. Update Metadata
        const updates: any = {
            role: 'admin'
        };
        if (tenantId) {
            updates.tenant_id = tenantId;
        }

        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { user_metadata: { ...user.user_metadata, ...updates } }
        );

        if (updateError) {
            throw new Error(`Error updating user: ${updateError.message}`);
        }

        console.log(`\n✅ Success! ${email} is now an Admin.`);
        console.log(`Tenant ID: ${tenantId || 'Unchanged/None'}`);
        console.log('Full Metadata:', data.user?.user_metadata);

    } catch (e: any) {
        console.error('\n❌ Error:', e.message);
    } finally {
        rl.close();
    }
}

main();
