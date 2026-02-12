import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { UserRole } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Shield, Mail, Lock, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const LoginPage = () => {
    const { user,devLogin } = useAuthStore();
    const navigate = useNavigate();

    const [step, setStep] = useState<'email' | 'code'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            if (user.role === 'spi-admin') navigate('/spi-admin');
            else if (user.role === 'client-admin') navigate('/client-admin');
            else navigate('/client');
        }
    }, [user, navigate]);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email.includes('@')) {
            setError('Ingresa un email válido');
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setStep('code');
        }, 1500);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API verification
        setTimeout(() => {
            setIsLoading(false);
            if (code === '123456') {
                // Determine role based on email simulation
                let role: UserRole = 'client';
                if (email.includes('admin') || email.includes('spi')) role = 'spi-admin';
                else if (email.includes('manager') || email.includes('jefe')) role = 'client-admin';
                
                devLogin(role); // This will trigger the useEffect redirect
            } else {
                setError('Código incorrecto. Intenta con 123456');
            }
        }, 1500);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-200 p-4">
            <Card className="w-full max-w-md glass-card border-border shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-primary w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Shield className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">SPI Smart Flow</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {step === 'email' 
                            ? 'Ingresa tu correo corporativo para acceder' 
                            : `Hemos enviado un código a ${email}`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'email' ? (
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground">Correo Electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="nombre@empresa.com" 
                                        className="pl-10 border-border bg-background focus-visible:ring-ring text-slate-900"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>
                            
                            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                                    </>
                                ) : (
                                    <>
                                        Enviar Código de Acceso <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <div className="mt-6 pt-6 border-t border-border">
                                <p className="text-xs text-center text-muted-foreground mb-3">Accesos rápidos (Demo):</p>
                                <div className="flex justify-center gap-2 text-xs">
                                    <button type="button" onClick={() => setEmail('admin@spi.cl')} className="px-2 py-1 bg-secondary rounded hover:bg-secondary/80 text-secondary-foreground">Admin</button>
                                    <button type="button" onClick={() => setEmail('manager@demo.com')} className="px-2 py-1 bg-secondary rounded hover:bg-secondary/80 text-secondary-foreground">Gerente</button>
                                    <button type="button" onClick={() => setEmail('usuario@demo.com')} className="px-2 py-1 bg-secondary rounded hover:bg-secondary/80 text-secondary-foreground">Cliente</button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="code" className="text-foreground">Código de Verificación</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        id="code" 
                                        type="text" 
                                        placeholder="123456" 
                                        className="pl-10 tracking-[0.5em] font-mono text-center text-lg border-border bg-background focus-visible:ring-ring text-slate-900"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        maxLength={6}
                                        autoFocus
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">Usa el código <strong>123456</strong> para la demo</p>
                            </div>

                             {error && <p className="text-sm text-destructive font-medium text-center">{error}</p>}

                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                                    </>
                                ) : (
                                    <>
                                        Ingresar al Portal <CheckCircle className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                            
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="w-full text-muted-foreground hover:text-foreground" 
                                onClick={() => { setStep('email'); setCode(''); setError(''); }}
                            >
                                Volver / Cambiar correo
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border py-4 bg-secondary/50 rounded-b-xl">
                    <p className="text-xs text-muted-foreground">© 2024 SPI Smart Flow · Secure Access</p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default LoginPage;
