
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);
    const [isAdminSignup, setIsAdminSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: isAdminSignup ? 'admin' : 'salesperson'
                        }
                    }
                });

                if (error) throw error;

                if (data.session) {
                    toast.success("Account created successfully!");
                    navigate('/');
                } else {
                    toast.success("Account created! Please check your email for verification.");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center pb-8">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {isSignUp ? 'Create an Account' : 'MoveTheBox CRM'}
                    </CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? 'Enter your details to create a new account'
                            : 'Enter your credentials to access the dashboard'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-9"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="pl-9 pr-9"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {isSignUp && (
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="admin"
                                    checked={isAdminSignup}
                                    onCheckedChange={(checked) => setIsAdminSignup(checked as boolean)}
                                />
                                <label
                                    htmlFor="admin"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Sign up as Administrator
                                </label>
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100 text-center">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading
                                ? (isSignUp ? 'Creating Account...' : 'Signing in...')
                                : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                setIsAdminSignup(false);
                            }}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center w-full gap-2"
                        >
                            {isSignUp ? (
                                <>
                                    <LogIn className="h-4 w-4" />
                                    Already have an account? Sign In
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Don't have an account? Sign Up
                                </>
                            )}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Auth;
