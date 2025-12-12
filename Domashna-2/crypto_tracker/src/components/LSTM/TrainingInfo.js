export default function TrainingInfo({ training }) {
    const infoItems = [
        {
            label: 'Lookback Period',
            value: `${training.lookback_period} days`,
            icon: '📅'
        },
        {
            label: 'Train/Test Split',
            value: training.train_test_split,
            icon: '📊'
        },
        {
            label: 'Training Epochs',
            value: training.epochs,
            icon: '🔄'
        },
        {
            label: 'Training Samples',
            value: training.train_samples,
            icon: '📈'
        },
        {
            label: 'Test Samples',
            value: training.test_samples,
            icon: '📉'
        },
        {
            label: 'Final Training Loss',
            value: training.final_training_loss.toFixed(6),
            icon: '🎯'
        },
        {
            label: 'Final Validation Loss',
            value: training.final_validation_loss.toFixed(6),
            icon: '✓'
        }
    ];

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 tracking-wide uppercase">
                Training Information
            </h3>
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {infoItems.map((item) => (
                        <div
                            key={item.label}
                            className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3 hover:border-gray-600/50 transition-colors duration-200"
                        >
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-xs text-gray-500">{item.label}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-200 ml-7">
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
