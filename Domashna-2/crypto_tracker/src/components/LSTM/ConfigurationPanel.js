export default function ConfigurationPanel({ config, onChange, onPredict, loading }) {
    const configOptions = [
        {
            key: 'lookback',
            label: 'Lookback Period',
            description: 'Days of historical data to analyze',
            min: 7,
            max: 90,
            step: 1,
            unit: 'days'
        },
        {
            key: 'epochs',
            label: 'Training Epochs',
            description: 'Number of training iterations',
            min: 10,
            max: 200,
            step: 10,
            unit: 'epochs'
        },
        {
            key: 'days_ahead',
            label: 'Prediction Period',
            description: 'Days to predict into the future',
            min: 1,
            max: 30,
            step: 1,
            unit: 'days'
        }
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 tracking-wide uppercase">
                Model Configuration
            </h3>

            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {configOptions.map((option) => (
                        <div key={option.key} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-300">
                                    {option.label}
                                </label>
                                <span className="text-sm font-bold text-blue-400">
                                    {config[option.key]} {option.unit}
                                </span>
                            </div>

                            <input
                                type="range"
                                min={option.min}
                                max={option.max}
                                step={option.step}
                                value={config[option.key]}
                                onChange={(e) => onChange(option.key, parseInt(e.target.value))}
                                disabled={loading}
                                className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         [&::-webkit-slider-thumb]:appearance-none
                                         [&::-webkit-slider-thumb]:w-4
                                         [&::-webkit-slider-thumb]:h-4
                                         [&::-webkit-slider-thumb]:rounded-full
                                         [&::-webkit-slider-thumb]:bg-blue-500
                                         [&::-webkit-slider-thumb]:cursor-pointer
                                         [&::-webkit-slider-thumb]:transition-all
                                         [&::-webkit-slider-thumb]:hover:bg-blue-400
                                         [&::-webkit-slider-thumb]:hover:scale-110
                                         [&::-moz-range-thumb]:w-4
                                         [&::-moz-range-thumb]:h-4
                                         [&::-moz-range-thumb]:rounded-full
                                         [&::-moz-range-thumb]:bg-blue-500
                                         [&::-moz-range-thumb]:border-0
                                         [&::-moz-range-thumb]:cursor-pointer
                                         [&::-moz-range-thumb]:transition-all
                                         [&::-moz-range-thumb]:hover:bg-blue-400"
                            />

                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{option.min}</span>
                                <span className="text-gray-400">{option.description}</span>
                                <span>{option.max}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700/50">
                    <button
                        onClick={onPredict}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                                 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed
                                 text-white font-semibold py-3 px-6 rounded-lg
                                 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100
                                 shadow-lg hover:shadow-xl disabled:shadow-none"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center space-x-2">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Training Model...</span>
                            </span>
                        ) : (
                            'Generate Predictions'
                        )}
                    </button>

                    {loading && (
                        <p className="text-xs text-center text-gray-500 mt-3">
                            This may take 30-60 seconds depending on configuration
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
