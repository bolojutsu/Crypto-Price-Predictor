import { useState } from "react";
import './index.css'

function PricePredict() {
    const [coinId, setCoinId] = useState("");
    const [investmentAmount, setInvestmentAmount] = useState("");
    const [targetMarketcap, setTargetMarketcap] = useState("");

    const [predictionData, setPredictionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getPrediction = async () => {
        if (!coinId.trim()) {
            setError("Please enter a valid coin Id")
            return;
        }

        if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
            setError("Please enter a valid investment amount")
            return;
        }

        setLoading(true);
        setError(null);
        setPredictionData(null);

        try {
            const queryParams = new URLSearchParams({
                coin_id: coinId.toLocaleLowerCase().trim(),
                investment_amount: investmentAmount
            });

            const response = await fetch(`http://127.0.0.1:5000/api/predict-price?${queryParams}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error("Faild to fetch prediction")
            }
            setPredictionData(data);
        } catch (error) {
            setError(error.message || "An error occurred while fetching prediction");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="background">
            <header>
                <h1>Crypto Price Predictor</h1>
                <p>Advanced algorithmic forecasting for your digital asset portfolio.</p>
            </header>

            <div className="input-section">
                <input
                    type="text"
                    placeholder="Coin ID (e.g. bitcoin)"
                    value={coinId}
                    onChange={(e) => setCoinId(e.target.value)}
                    disabled={loading}
                />
                <input
                    type="number"
                    placeholder="Investment (USD)"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    disabled={loading}
                />
                <input
                    type="number"
                    placeholder="Target Market Cap (USD)"
                    onChange={(e) => setTargetMarketcap(e.target.value)}
                />
                <button onClick={getPrediction} disabled={loading}>
                    {loading ? "Analyzing..." : "Predict Price"}
                </button>
            </div>

            {error &&
                <div className="error-section">
                    {error}
                </div>
            }

            {predictionData && (
                <div style={{ width: '100%', maxWidth: '1000px' }}>
                    <h2 style={{ textAlign: 'center', margin: '40px 0 20px' }}>
                        Market Analysis: {predictionData.coin.toUpperCase()}
                    </h2>

                    <div className="results-grid">

                        {/* Current Price Card */}
                        <div className="card">
                            <h3>Current Status</h3>
                            <p className="metric-value">${predictionData.current_price.toLocaleString()}</p>
                            <small>MCap:${predictionData.current_Marketcap.toLocaleString()}</small>
                        </div>

                        {/* Target Price Card */}
                        <div className="card">
                            <h3>Target Price</h3>
                            <p className="metric-value" style={{ color: 'var(--accent-color)' }}>
                                ${predictionData.target_price.toLocaleString()}
                            </p>
                            <small>Based on ${predictionData.target_mcap.toLocaleString()} MCap</small>
                        </div>

                        {/* ROI Card */}
                        <div className="card">
                            <h3>Predicted ROI</h3>
                            <div className="roi-badge" style={{
                                backgroundColor: predictionData.roi_percent >= 0 ? 'rgba(14, 203, 129, 0.2)' : 'rgba(246, 70, 93, 0.2)',
                                color: predictionData.roi_percent >= 0 ? '#0ecb81' : '#f6465d'
                            }}>
                                {predictionData.roi_percent}%
                            </div>
                            <p>Future Portfolio Value: ${predictionData.potential_value.toLocaleString()}</p>
                        </div>

                        {/* Current Market Card */}
                        <div className="card">
                            <h3>Market Status</h3>
                            <div className="metric-item">
                                <p>Price</p>
                                <div className="metric-value">${predictionData.current_metrics.price.toLocaleString()}</div>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Vol: ${predictionData.current_metrics.volume.toLocaleString()}
                            </p>
                        </div>

                        {/* Prediction Card */}
                        <div className="card">
                            <h3>Price Forecast</h3>
                            <div className="metric-value" style={{ color: 'var(--accent-color)' }}>
                                ${predictionData.prediction.estimated_target.toLocaleString()}
                            </div>
                            <p style={{
                                color: predictionData.prediction.price_change_percent >= 0 ? 'var(--success)' : 'var(--error)'
                            }}>
                                {predictionData.prediction.price_change_percent}% {predictionData.prediction.trend}
                            </p>
                            <small>Confidence: {predictionData.prediction.confidence_score}%</small>
                        </div>

                        {/* Investment Card */}
                        <div className="card" style={{ gridColumn: '1 / -1' }}>
                            <h3>Expected ROI</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Future Value</p>
                                    <div className="metric-value" style={{ fontSize: '2.5rem' }}>
                                        ${predictionData.investment.future_value.toLocaleString()}
                                    </div>
                                </div>
                                <div className="roi-badge" style={{
                                    backgroundColor: predictionData.investment.roi >= 0 ? 'rgba(14, 203, 129, 0.15)' : 'rgba(246, 70, 93, 0.15)',
                                    color: predictionData.investment.roi >= 0 ? 'var(--success)' : 'var(--error)'
                                }}>
                                    {predictionData.investment.roi >= 0 ? "+" : ""}
                                    {predictionData.investment.roi_percent}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PricePredict;
