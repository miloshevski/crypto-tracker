'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function PredictionChart({ historicalData, validationPredictions, predictions }) {
    // Combine validation data (actual vs predicted) and future predictions
    const chartData = [
        // Validation data: show both actual and predicted for the test set
        ...(validationPredictions || []).map(v => ({
            date: v.date,
            actual: v.actual_price,
            predicted: v.predicted_price,
            type: 'validation'
        })),
        // Future predictions: only predicted values
        ...(predictions || []).map(p => ({
            date: p.date,
            future_predicted: p.predicted_price,
            type: 'future'
        }))
    ];

    const lastValidationDate = validationPredictions?.length > 0
        ? validationPredictions[validationPredictions.length - 1].date
        : null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataType = payload[0]?.payload?.type;
            const isValidation = dataType === 'validation';
            const isFuture = dataType === 'future';

            return (
                <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                    <p className="text-gray-400 text-xs mb-2">{label}</p>
                    {isValidation ? (
                        <div className="space-y-1">
                            <p className="text-blue-400 font-semibold">
                                Actual: ${payload.find(p => p.dataKey === 'actual')?.value?.toFixed(2)}
                            </p>
                            <p className="text-purple-400 font-semibold">
                                Predicted: ${payload.find(p => p.dataKey === 'predicted')?.value?.toFixed(2)}
                            </p>
                            {payload.find(p => p.dataKey === 'actual') && payload.find(p => p.dataKey === 'predicted') && (
                                <p className="text-gray-500 text-xs">
                                    Error: ${Math.abs(payload.find(p => p.dataKey === 'actual').value - payload.find(p => p.dataKey === 'predicted').value).toFixed(2)}
                                </p>
                            )}
                        </div>
                    ) : isFuture ? (
                        <p className="text-green-400 font-semibold">
                            Future Prediction: ${payload[0].value?.toFixed(2)}
                        </p>
                    ) : null}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 tracking-wide uppercase">
                Model Validation & Future Predictions
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

                        {/* Actual prices (validation set) */}
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#60A5FA"
                            strokeWidth={2}
                            dot={false}
                            name="Actual Price (Test Set)"
                            connectNulls={false}
                        />

                        {/* Predicted prices (validation set) */}
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#A78BFA"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#A78BFA', r: 3 }}
                            name="Model Prediction (Test Set)"
                            connectNulls={false}
                        />

                        {/* Future predictions */}
                        <Line
                            type="monotone"
                            dataKey="future_predicted"
                            stroke="#10B981"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            dot={{ fill: '#10B981', r: 4 }}
                            name="Future Prediction"
                            connectNulls={false}
                        />

                        {/* Reference line at the transition from validation to future */}
                        {lastValidationDate && (
                            <ReferenceLine
                                x={lastValidationDate}
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

                <div className="mt-4 flex gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                        <span>Actual prices from test set</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-purple-500 border-dashed"></div>
                        <span>Model predictions on test set</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-green-500 border-dashed"></div>
                        <span>Future predictions</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
