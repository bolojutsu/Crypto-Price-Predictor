import { useState } from "react";
import './index.css'
import PriceChart from "./PriceChart";

function PricePredict() {
    const [coinId, setCoinId] = useState("");
    const [investmentAmount, setInvestmentAmount] = useState("");
    const [targetMarketcap, setTargetMarketcap] = useState("");
    const [historyData, setHistoryData] = useState([]);
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
            let response;
            let mode;

            const histroyResponse = await fetch(`http://127.0.0.1:5000/api/history/${coinId.toLowerCase().trim()}`);
            const histroyJson = await histroyResponse.json();

            setHistoryData(histroyJson);

            if (targetMarketcap && parseFloat(targetMarketcap) > 0) {
                mode = "target"
                const queryParams = new URLSearchParams({
                    coin_id: coinId.toLowerCase().trim(),
                    target_mcap: targetMarketcap,
                    investment: investmentAmount || 0
                })
                response = await fetch(`http://127.0.0.1:5000/api/target-prediction?${queryParams}`)
            } else {
                mode = "standard"
                const queryParams = new URLSearchParams({
                    coin_id: coinId.toLowerCase().trim(),
                    investment_amount: investmentAmount || 0
                });
                response = await fetch(`http://127.0.0.1:5000/api/predict-price?${queryParams}`)
            }

            if (!response.ok) {
                throw new Error("Faild to fetch prediction")
            }


            const data = await response.json()
            setPredictionData({ ...data, viewMode: mode });

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

            {error && <div className="error-section">{error}</div>}

            {predictionData && (
                <div style={{ width: '100%', maxWidth: '1000px' }}>
                    <h2 style={{ textAlign: 'center', margin: '40px 0 20px' }}>
                        {predictionData.viewMode === 'target' ? 'Target Analysis' : 'Market Forecast'}: {predictionData.coin.toUpperCase()}
                    </h2>

                    <div className="results-grid">
                        {/* Universal Card: Always shown */}
                        <div className="card">
                            <h3>Current Status</h3>
                            <p className="metric-value">${predictionData.current_price.toLocaleString()}</p>
                            <small>MCap: ${(predictionData.current_mcap || predictionData.current_Marketcap).toLocaleString()}</small>
                        </div>

                        {/* MODE: Target Market Cap Results */}
                        {predictionData.viewMode === 'target' ? (
                            <>
                                <div className="card">
                                    <h3>Target Price</h3>
                                    <p className="metric-value" style={{ color: '#f0b90b' }}>
                                        ${predictionData.target_price.toLocaleString()}
                                    </p>
                                    <small>Based on ${predictionData.target_mcap.toLocaleString()} MCap</small>
                                </div>
                                <div className="card" style={{ gridColumn: '1 / -1' }}>
                                    <h3>Predicted ROI</h3>
                                    <div className="roi-badge" style={{
                                        backgroundColor: predictionData.roi_percent >= 0 ? 'rgba(14, 203, 129, 0.2)' : 'rgba(246, 70, 93, 0.2)',
                                        color: predictionData.roi_percent >= 0 ? '#0ecb81' : '#f6465d'
                                    }}>
                                        {predictionData.roi_percent}%
                                    </div>
                                    <p>Future Portfolio Value: ${predictionData.potential_value.toLocaleString()}</p>
                                </div>
                            </>
                        ) : (
                            /* MODE: Standard Algorithmic Results */
                            <>
                                <div className="card">
                                    <h3>Price Forecast</h3>
                                    <div className="metric-value" style={{ color: '#f0b90b' }}>
                                        ${predictionData.prediction.estimated_target.toLocaleString()}
                                    </div>
                                    <small>Confidence: {predictionData.prediction.confidence_score}%</small>
                                </div>
                                <div className="card" style={{ gridColumn: '1 / -1' }}>
                                    <h3>Expected ROI</h3>
                                    <div className="metric-value" style={{ fontSize: '2.5rem' }}>
                                        ${predictionData.investment.future_value.toLocaleString()}
                                    </div>
                                    <p>ROI: {predictionData.investment.roi_percent}%</p>
                                </div>
                            </>
                        )}

                        {/* History Chart: Always shown if data exists */}
                        {historyData.length > 0 && <PriceChart data={historyData} />}
                    </div>
                </div>
            )}
        </div>
    );
}
export default PricePredict;
