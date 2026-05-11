import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import BuyModule from './BuyModule';
import SellModule from './SellModule';

export default function Buy() {
    const [activeTab, setActiveTab] = useState('mint');

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const roleParam = searchParams.get('mode');
        if (roleParam) {
            setActiveTab(roleParam);
        }
    }, [searchParams]);

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label);

            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.set('mode', label.toLowerCase());

            router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
        }
    };

    return (
        <div className='pb-4 md:pb-6'>
            {activeTab === 'mint' && <BuyModule onSwitchToSell={() => handleTabChange('sell')} />}
            {activeTab === 'sell' && <SellModule onSwitchToBuy={() => handleTabChange('mint')} />}
        </div>
    )
}
