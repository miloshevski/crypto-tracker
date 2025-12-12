'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function PredictionChart({ historicalData, predictions }) {
    // Combine historical and predicted data
    const chartData = [
        ...historicalData.slice(-30).map(d => ({
            date: d.date,
            actual: d.close,
            type: 'historical'
        })),
        ...predictions.map(p => ({
            date: p.date,
            predicted: p.predicted_price,
            type: 'prediction'
        }))
    ];

    const lastHistoricalPrice = historicalData[historicalData.length - 1]?.close;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const isHistorical = payload[0]?.payload?.type === 'historical';
            return (
                <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                    <p className="text-gray-400 text-xs mb-1">{label}</p>
                    {isHistorical ? (
                        <p className="text-blue-400 font-semibold">
                            Actual: ${payload[0].value?.toFixed(2)}
                        </p>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-purple-400 font-semibold">
                                Predicted: ${payload[0].value?.toFixed(2)}
                            </p>
                            {lastHistoricalPrice && (
                                <p className="text-gray-500 text-xs">
                                    Change: {((payload[0].value - lastHistoricalPrice) / lastHistoricalPrice * 100).toFixed(2)}%
                                </p>
                            )}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 tracking-wide uppercase">
                Price Predictions
            </h3>
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 rounded-xl p-6">
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                            iconType="line"
                        />

                        {/* Historical data line */}
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#60A5FA"
                            strokeWidth={2}
                            dot={false}
                            name="Historical Price"
                            connectNulls={false}
                        />

                        {/* Predicted data line */}
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#A78BFA"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#A78BFA', r: 4 }}
                            name="Predicted Price"
                            connectNulls={false}
                        />

                        {/* Reference line at the transition point */}
                        {lastHistoricalPrice && (
                            <ReferenceLine
                                x={historicalData[historicalData.length - 1]?.date}
                                stroke="#6B7280"
                                strokeDasharray="3 3"
                                label={{
                                    value: 'Today',
                                    fill: '#9CA3AF',
                                    fontSize: 12,
                                    position: 'top'
                                }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
