import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ArrowRight } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
      
      <div className="mb-8 z-10 flex justify-center w-full">
        <Link to="/" className="bg-white px-6 py-3 rounded-lg flex items-center">
          <img 
            src="/logo/difaryx.png" 
            alt="DIFARYX" 
            className="h-12 md:h-16 object-contain hover:opacity-90 cursor-pointer transition-none"
          />
        </Link>
      </div>

      <Card className="w-full max-w-md z-10 bg-surface/80 backdrop-blur-md shadow-2xl border-white/10">
        <CardHeader className="text-center pb-2">
          <h2 className="text-2xl font-bold tracking-tight">Welcome to DIFARYX</h2>
          <p className="text-sm text-text-muted mt-2">Sign in to save projects and access full analysis history.</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Button 
            className="w-full h-12 text-base font-semibold bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-3"
            onClick={() => navigate('/dashboard')}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
              <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-text-muted">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 text-base flex justify-between px-4 group hover:border-primary/50"
            onClick={() => navigate('/dashboard')}
          >
            Continue as Guest Demo
            <ArrowRight size={18} className="text-text-muted group-hover:text-primary transition-colors" />
          </Button>
          <p className="text-center text-xs text-text-dim mt-4">
            Guest sessions are temporary and will not save project data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
