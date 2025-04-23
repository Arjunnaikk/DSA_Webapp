import { ALGORITHM_CATEGORIES } from "@/lib/constants";
import { AlgorithmCard } from "./algorithm-card";

interface AlgorithmsSectionProps {
    className?: string;
}

export function AlgorithmsSection({ className }: AlgorithmsSectionProps) {
    return (
        <section id="algorithms" className={className}>
            <div className="container px-4 py-16">
                <h2 className="text-3xl font-bold mb-8 text-center">
                    Choose an Algorithm Category
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {ALGORITHM_CATEGORIES.map((category: any) => (
                        <AlgorithmCard
                            key={category.id}
                            id={category.id}
                            title={category.title}
                            description={category.description}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}