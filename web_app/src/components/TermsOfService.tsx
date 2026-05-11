"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
    const [showTOS, setShowTOS] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const hasAccepted = sessionStorage.getItem('tos_accepted');

        if (!hasAccepted) {
            setShowTOS(true);
        }

        setIsChecking(false);
    }, []);

    const handleAccept = () => {
        sessionStorage.setItem('tos_accepted', 'true');
        setShowTOS(false);
    };

    const handleReject = () => {
        router.push('/');
    };

    const handleViewFullTerms = () => {
        window.open('/tos', '_blank');
    };

    if (isChecking) {
        return (
            <div className='fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white' />
            </div>
        );
    }

    if (!showTOS) {
        return null;
    }

    return (
        <div className='fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col'>
                <div className='p-4 border-b'>
                    <h2 className='text-2xl font-bold'>Terms of Service</h2>
                    <p className='text-sm mt-1'>Last Updated: 24 September 2024</p>
                </div>

                <div className='p-4 overflow-y-auto grow'>
                    <div className='space-y-4'>
                        <p className='font-medium'>
                            Welcome to BIT10! Before you proceed, please read and accept our Terms of Service.
                        </p>

                        <p>
                            By accessing or using BIT10, you agree to be bound by these terms and conditions. If you do not agree with any part of these terms, please refrain from using our services.
                        </p>

                        <h3 className='font-semibold mb-2'>Key Points:</h3>
                        <ul className='space-y-2 text-sm'>
                            <li className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>You must be at least 18 years old to use this service</span>
                            </li>
                            <li className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>You are responsible for your own tax obligations</span>
                            </li>
                            <li className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>Digital tokens are volatile and carry inherent risks</span>
                            </li>
                            <li className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>You have full custody and control of your digital tokens</span>
                            </li>
                            <li className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>Certain tokens have restrictions for U.S. persons</span>
                            </li>
                            <li className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>Disputes are subject to binding arbitration</span>
                            </li>
                        </ul>

                        <div className='space-y-2'>
                            <h3 className='font-semibold'>Eligibility Requirements</h3>
                            <p className='text-sm'>
                                To use BIT10, you must be at least 18 years old and able to form a legally binding contract.
                                You must not be subject to U.S. sanctions or a resident of an embargoed jurisdiction.
                            </p>
                        </div>

                        <div className='space-y-2'>
                            <h3 className='font-semibold'>Restricted Persons</h3>
                            <p className='text-sm'>
                                Certain tokens are restricted for U.S. persons, including citizens, residents, green card holders,
                                and entities incorporated or controlled by persons in the United States.
                            </p>
                        </div>

                        <div className='space-y-2'>
                            <h3 className='font-semibold'>Risk Disclosure</h3>
                            <p className='text-sm'>
                                Digital token markets are highly volatile. You assume all risks associated with ownership,
                                including regulatory, technology, and market risks. BIT10 is not registered with any financial
                                regulatory authority and does not provide investment advice.
                            </p>
                        </div>

                        <div className='border-t pt-4 mt-4'>
                            <button onClick={handleViewFullTerms} className='hover:text-primary text-sm font-medium underline'>
                                View Full Terms of Service →
                            </button>
                        </div>
                    </div>
                </div>

                <div className='p-4 border-t rounded-b-xl flex gap-3 justify-end'>
                    <Button variant='destructive' onClick={handleReject}>Reject</Button>
                    <Button onClick={handleAccept}>Accept & Continue</Button>
                </div>
            </div>
        </div>
    );
}
