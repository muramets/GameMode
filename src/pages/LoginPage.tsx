/**
 * LoginPage
 * 
 * Premium login experience with:
 * - Multi-layer gradient background
 * - MonkeyType-style logo (monkeytry above monkeylearn)
 * - Dark panel behind content
 * - Button atom component
 */

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/atoms/Button';

// Google icon as SVG
function GoogleIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

export default function LoginPage() {
    const { signInWithGoogle, user, loading } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (user) {
        return <Navigate to="/" />;
    }

    const handleSignIn = async () => {
        setIsSigningIn(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch {
            setError('Failed to sign in. Please try again.');
            setIsSigningIn(false);
        }
    };


    return (
        <>
            <style>{`
                @media (max-width: 525px) {
                    .login-container {
                        background-color: var(--sub-alt-color) !important;
                        min-width: 100vw !important;
                    }
                    .login-panel {
                        box-shadow: none !important;
                        background-color: transparent !important;
                        min-width: 0 !important;
                        width: 100% !important;
                        padding: 2rem !important;
                    }
                }
            `}</style>
            <div
                className="login-container relative min-h-screen flex items-center justify-center font-mono cursor-default select-none"
                style={{ backgroundColor: 'var(--bg-color)' }}
            >
                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="login-panel relative z-10 text-center px-24 py-20 flex flex-col items-center rounded-3xl min-w-[500px] hover:shadow-2xl transition-shadow duration-300"
                    style={{
                        backgroundColor: 'var(--sub-alt-color)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {/* Title with monkeytry above (Header style - Lexend Deca) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="mb-6 relative"
                    >
                        {/* monkeytry - positioned above and left-aligned */}
                        <div
                            className="absolute left-[4px] text-[12px] leading-[0.325em] whitespace-nowrap font-normal top-[-4px]"
                            style={{
                                fontFamily: '"Lexend Deca", sans-serif',
                                color: 'var(--sub-color)',
                            }}
                        >
                            monkey try
                        </div>
                        {/* monkeylearn - main title */}
                        <span
                            className="text-5xl block"
                            style={{
                                fontFamily: '"Lexend Deca", sans-serif',
                                fontWeight: 400,
                                color: 'var(--text-color)',
                            }}
                        >
                            monkeylearn
                        </span>
                    </motion.div>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="text-base mb-12 lowercase"
                        style={{ color: 'var(--sub-color)' }}
                    >
                        level up your life
                    </motion.p>

                    {/* Sign in button (using Button atom) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="w-full max-w-[320px]"
                    >
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleSignIn}
                            isLoading={isSigningIn || loading}
                            leftIcon={!isSigningIn && !loading ? <GoogleIcon /> : undefined}
                            className="w-full lowercase h-12 text-base"
                        >
                            {isSigningIn || loading ? 'signing in...' : 'continue with google'}
                        </Button>
                    </motion.div>

                    {/* Error message */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-6 text-sm lowercase"
                                style={{ color: 'var(--error-color)' }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </>
    );
}
