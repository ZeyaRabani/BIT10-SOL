import React from 'react';
import TermsOfService from '@/components/TermsOfService';
import Navbar from '@/components/Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <TermsOfService />
            <Navbar />
            <main className='grow flex-1 pt-18'>
                {children}
            </main>
        </div>
    )
}