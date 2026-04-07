import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Navbar />
            <main className='grow flex-1 pt-16'>
                {children}
            </main>
            <Footer />
        </div>
    )
}
