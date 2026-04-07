"use client"

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, SettingsIcon, LandmarkIcon, Coins, BriefcaseBusiness, BookText, CalculatorIcon, Landmark, GiftIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import WalletBtn from './WalletBtn';

const links = {
    web: [
        { title: 'How It Works', link: '?id=how-it-works', icon: SettingsIcon },
        { title: 'Proof-of-Reserves', link: '?id=reserves', icon: LandmarkIcon },
        { title: 'Investment Calculator', link: '/investment-calculator', icon: CalculatorIcon },
        { title: 'GitBook', link: '/gitbook', icon: BookText }
    ],
    app: [
        { title: 'Mint BIT10.TOP', link: '/mint', icon: Coins },
        { title: 'Portfolio', link: '/portfolio', icon: BriefcaseBusiness },
        { title: 'Collateral', link: '/collateral', icon: Landmark },
        { title: 'Rewards', link: '/rewards', icon: GiftIcon }
    ]
};

const externalRoutes = {
    appMode: ['/explorer', '/explorer/', '/mint'],
    webMode: ['/', '/contact'],
};

export default function ResponsiveNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);

    const pathname = usePathname();
    const router = useRouter();

    const isAppMode = () => {
        if (externalRoutes.appMode.includes(pathname)) {
            return true;
        }

        if (externalRoutes.webMode.includes(pathname)) {
            return false;
        }

        return links.app.some(link => pathname.startsWith(link.link));
    };

    const appMode = isAppMode();

    const toggleMenu = () => {
        if (isOpen) {
            setIsClosing(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsClosing(false);
            }, 300);
        } else {
            setIsOpen(true);
        }
    };

    const handleLinkClick = (link: string) => {
        // Check if it's a section link (starts with ?id=)
        if (link.startsWith('?id=')) {
            const sectionId = link.replace('?id=', '');

            // Close the menu first
            toggleMenu();

            // If we're already on the home page, just scroll
            if (pathname === '/') {
                setTimeout(() => {
                    const element = document.getElementById(sectionId);
                    if (element) {
                        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                        const offsetPosition = elementPosition - 30;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }, 350); // Wait for menu close animation
            } else {
                // Navigate to home page with the section id
                router.push(`/${link}`);
            }
        } else if (pathname === link) {
            // If clicking on current page, just close menu
            toggleMenu();
        }
        // For other links, let the Link component handle navigation normally
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (isOpen) toggleMenu(); }, [pathname]);

    return (
        <div className='lg:hidden'>
            <button onClick={toggleMenu} className='pt-1'>
                <Menu className='h-7 w-7' />
            </button>

            {isOpen && (
                <div>
                    <div className={`flex overflow-x-hidden mx-2 -mt-2 h-screen overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none lg:hidden transition-all duration-200 ${isClosing ? 'animate-fade-out-up' : 'animate-fade-in-down'}`}>
                        <div className='relative my-4 mx-auto w-screen'>
                            <div className='border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-background outline-none focus:outline-none'>
                                <div className='flex items-start justify-between px-5 py-2 border-solid rounded-t'>
                                    <Link href='/' passHref>
                                        <Image src='/logo/logo-circle.png' alt='logo' width={60} height={60} />
                                    </Link>

                                    <button className='absolute top-4 right-6' onClick={toggleMenu} aria-hidden='false' aria-label='button'>
                                        <X className='h-7 w-7' aria-hidden='false' />
                                    </button>
                                </div>

                                <div className='grid justify-center'>
                                    <div className='inline-flex w-64 h-1 bg-indigo-500 rounded-full' />
                                </div>

                                <div className='grid px-8 text-xl py-2 gap-2 w-full mb-4'>
                                    {links[appMode ? 'app' : 'web'].map(({ title, link, icon: Icon }) => (
                                        <Link
                                            key={link}
                                            href={link}
                                            onClick={(e) => {
                                                if (link.startsWith('?id=')) {
                                                    e.preventDefault();
                                                    handleLinkClick(link);
                                                } else {
                                                    handleLinkClick(link);
                                                }
                                            }}
                                        >
                                            <div className='border-b-2 pt-0.5 pb-2 px-2 cursor-pointer w-full flex flex-row justify-between items-center'>
                                                {title}
                                                <Icon />
                                            </div>
                                        </Link>
                                    ))}
                                    {appMode ? (
                                        <div className='border-b-2 pb-2 w-full'>
                                            <WalletBtn />
                                        </div>
                                    ) : (
                                        <div className='border-b-2 pb-2 cursor-pointer w-full'>
                                            <Link href='/mint' passHref>
                                                <Button className='w-full'>Launch App</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='opacity-25 fixed inset-0 z-40 h-[200vh] bg-black md:hidden'></div>
                </div>
            )}
        </div>
    )
}
