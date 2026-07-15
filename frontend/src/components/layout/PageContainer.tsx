import type { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

export function PageContainer({
    children,
    className = "",
}: PageContainerProps) {
    return (
        <div className = {`mx-auto w-full max-w-[120rem] px-2 sm:px-6 lg:px-8 ${className}`}>
            {children}
        </div>
    )
}