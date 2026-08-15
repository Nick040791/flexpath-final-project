import { useMemo } from 'react';
import { useSearch } from '../hooks/useSearch';
import { PartFields } from '../utils/constants';
import { average, median, formatNumber } from '../utils/stats';

function PartCards() {
    const { results, status } = useSearch();
    const metricData = useMemo(() => {
        return PartFields.map((field) => {
            const values = results
            .map((record) => Number(record[field.key]))
            .filter((value) => !Number.isNaN(value));

            return {
                title: field.title,
                unit: field.unit,
                averageValue: average(values),
                medianValue: median(values),
            };
        });
    },[results])

    if (results.length === 0 && status != 'loading') {
        return (
            <section className="container py-4">
                <div className="card text-center text-muted">
                    <div className="card-body">
                        Run a search to see metrics.
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="container py-4">
            <div className="row row-cols-1 row-col-me-4 g-3">
                {
                    metricData.map((metric) => (
                        <div className="col" key={metric.title}>
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h2 className="h5 card-title">{metric.title}</h2>

                                    <p className="card-text mb-1">
                                        Average: {formatNumber(metric.averageValue)} {metric.unit}
                                    </p>

                                    <p className="card-text mb-0">
                                        Median: {formatNumber(metric.medianValue)} {metric.unit}
                                    </p>
                                </div>
                            </div>
                        </div>
                        )
                    )
                }

            </div>
        </section>
    );
};

export default PartCards;