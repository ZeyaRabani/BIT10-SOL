"use client";

import { cn } from '@/lib/utils';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { Children, cloneElement, type ReactElement, useEffect, useState, useId } from 'react';

type AnimatedBackgroundProps = {
    children: ReactElement<{ 'data-id': string }>[] | ReactElement<{ 'data-id': string }>;
    defaultValue?: string;
    onValueChange?: (newActiveId: string | null) => void;
    className?: string;
    transition?: Transition;
    enableHover?: boolean;
};

export function AnimatedBackground({ children, defaultValue, onValueChange, className, transition, enableHover = false }: AnimatedBackgroundProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const uniqueId = useId();

    const handleActiveId = (id: string | null) => {
        setActiveId(id);
        if (onValueChange) return onValueChange(id);
    };

    useEffect(() => {
        if (defaultValue !== undefined) return setActiveId(defaultValue);
    }, [defaultValue]);

    return Children.map(children, (child: ReactElement<{ 'data-id': string }>, index) => {
        const id = child.props['data-id'];

        const interactionProps = enableHover
            ? {
                onMouseEnter: () => handleActiveId(id),
                onMouseLeave: () => handleActiveId(null),
            }
            : {
                onClick: () => handleActiveId(id),
            };

        return cloneElement(
            child,
            {
                key: index,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                className: cn('relative inline-flex', child.props.className),
                'aria-selected': activeId === id,
                'data-checked': activeId === id ? 'true' : 'false',
                ...interactionProps,
            },
            <>
                <AnimatePresence initial={false} mode="wait" >
                    {activeId === id && (
                        <motion.div
                            layoutId={`background-${uniqueId}`}
                            className={cn('absolute inset-0', className)}
                            transition={transition}
                            initial={{ opacity: defaultValue ? 1 : 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            viewport={{ once: true }}
                        />
                    )}
                </AnimatePresence>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-expect-error */}
                <span className='z-10'>{child.props.children}</span>
            </>
        );
    });
}
