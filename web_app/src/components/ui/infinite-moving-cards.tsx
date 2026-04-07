"use client"

import { cn } from '@/lib/utils'
import React, { useEffect, useState } from 'react'
import Image, { type StaticImageData } from 'next/image'

export const InfiniteMovingCards = ({ items, direction = 'left', speed = 'fast', pauseOnHover = true, className }: {
    items: {
        x_link: string;
        tweet: string;
        profile_pic: StaticImageData;
        name: string;
        username: string;
    }[];
    direction?: 'left' | 'right';
    speed?: 'fast' | 'normal' | 'slow';
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollerRef = React.useRef<HTMLUListElement>(null);

    useEffect(() => {
        addAnimation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [start, setStart] = useState(false);

    function addAnimation() {
        if (containerRef.current && scrollerRef.current) {
            const scrollerContent = Array.from(scrollerRef.current.children);

            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                if (scrollerRef.current) {
                    scrollerRef.current.appendChild(duplicatedItem);
                }
            });

            getDirection();
            getSpeed();
            setStart(true);
        }
    }
    const getDirection = () => {
        if (containerRef.current) {
            if (direction === 'left') {
                containerRef.current.style.setProperty(
                    '--animation-direction',
                    'forwards'
                );
            } else {
                containerRef.current.style.setProperty(
                    '--animation-direction',
                    'reverse'
                );
            }
        }
    };
    const getSpeed = () => {
        if (containerRef.current) {
            if (speed === 'fast') {
                containerRef.current.style.setProperty('--animation-duration', '20s');
            } else if (speed === 'normal') {
                containerRef.current.style.setProperty('--animation-duration', '40s');
            } else {
                containerRef.current.style.setProperty('--animation-duration', '80s');
            }
        }
    };
    return (
        <div
            ref={containerRef}
            className={cn(
                'scroller relative z-20 max-w-7xl overflow-hidden mask-[linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]',
                className
            )}
        >
            <ul
                ref={scrollerRef}
                className={cn(
                    ' flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap',
                    start && 'animate-marquee-left',
                    pauseOnHover && 'hover:paused'
                )}
            >
                {items.map((item, idx) => (
                    <a href={item.x_link} target='_blank' rel='noreferrer noopener' key={idx}>
                        <li
                            // className='w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px]'
                            className='w-[350px] max-w-full relative rounded-2xl shrink-0 border px-8 py-6 md:w-[450px] bg-card'
                        // style={{
                        //     background:
                        //         'linear-gradient(180deg, var(--slate-800), var(--slate-900)',
                        // }}
                        >
                            <blockquote>
                                <div aria-hidden='true' className='user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)]' />
                                <div className='relative text-sm leading-[1.6] font-normal'>
                                    {item.tweet}
                                </div>
                                <div className='flex flex-row items-center space-x-1 pt-4'>
                                    <div>
                                        <Image src={item.profile_pic} alt='parterner' height='50' width='50' className='rounded-full border' />
                                    </div>
                                    <div className='flex flex-col'>
                                        <h1 className='text-sm leading-[1.6] text-gray-400 font-normal'>{item.name}</h1>
                                        <h1 className='text-sm leading-[1.6] text-gray-400 font-normal'>@{item.username}</h1>
                                    </div>
                                </div>
                            </blockquote>
                        </li>
                    </a>
                ))}
            </ul>
        </div>
    );
};
