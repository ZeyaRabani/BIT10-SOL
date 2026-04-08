import React from 'react'
import Navbar from '@/components/Navbar'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Navbar />
            <main className='grow flex-1 pt-16'>
                {children}
            </main>
        </div>
    )
}
