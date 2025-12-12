export default function MetricsDisplay({ metrics }) {
    const metricsConfig = [
        {
            name: 'RMSE',
            value: metrics.rmse,
            description: 'Root Mean Square Error',
            format: (val) => `$${val.toFixed(2)}`,
            color: 'blue'
        },
        {
            name: 'MAPE',
            value: metrics.mape,
            description: 'Mean Absolute Percentage Error',
            format: (val) => `${val.toFixed(2)}%`,
            color: 'purple'
        },
        {
            name: 'R² Score',
            value: metrics.r2_score,
            description: 'Coefficient of Determination',
            format: (val) => val.toFixed(4),
            color: 'emerald',
            quality: (val) => {
                if (val > 0.9) return 'Excellent';
                if (val > 0.7) return 'Good';
                if (val > 0.5) return 'Moderate';
                return 'Poor';
            }
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: {
                bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
                border: 'border-blue-500/30',
                text: 'text-blue-400',
                label: 'text-blue-300/70'
            },
            purple: {
                bg: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
                border: 'border-purple-500/30',
                text: 'text-purple-400',
                label: 'text-purple-300/70'
            },
            emerald: {
                bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
                border: 'border-emerald-500/30',
                text: 'text-emerald-400',
                label: 'text-emerald-300/70'
            }
        };
        return colors[color];
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 tracking-wide uppercase">
                Model Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metricsConfig.map((metric) => {
                    const colors = getColorClasses(metric.color);
                    return (
                        <div
                            key={metric.name}
                            className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]`}
                        >
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium ${colors.label} tracking-wider`}>
                                        {metric.name}
                                    </span>
                                    {metric.quality && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.border} border ${colors.text}`}>
                                            {metric.quality(metric.value)}
                                        </span>
                                    )}
                                </div>
                                <div className={`text-2xl font-bold ${colors.text} tracking-tight`}>
                                    {metric.format(metric.value)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {metric.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
