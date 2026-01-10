from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)
API_KEY = os.environ.get("COINGECKO_API_KEY")
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"


@app.route("/api/coingecko/<path:endpoint>")
def coingecko_proxy(endpoint):
    try:
        url = f"{COINGECKO_BASE_URL}/{endpoint}"
        parameters = request.args.to_dict()

        headers = {"x-cg-demo-api-key": API_KEY}

        response = requests.get(url, headers=headers, params=parameters)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict-price")
def predict_price():
    coin_id = requests.args.get("coin_id", "bitcoin").lower()
    investment_amount = requests.args.get("investment_amount", type=float)

    if investment_amount is None or investment_amount <= 0:
        return (
            jsonify({"error": "Invalid investment amount. Must be a positive number"}),
            400,
        )

    try:
        headers = {"x-cg-demo-api-key": API_KEY}

        # 1. fetching current Market Data
        coin_url = f"{COINGECKO_BASE_URL}/coins/{coin_id}"
        params = {
            "localization": "false",
            "tickers": "false",
            "community_data": "false",
            "developer_data": "false",
            "sparkline": "false",
        }
        coin_response = requests.get(coin_url, headers=headers, params=params)
        coin_data = coin_response.json()

        if "market_data" not in coin_data:
            return jsonify({"error": "Data incomplete or invalid coin ID"}), 404

        # 2. Fetching 7-Day History for momentum calculation
        history_url = f"{COINGECKO_BASE_URL}/coins/{coin_id}/market_chart"
        history_params = {"vs_currency": "usd", "days": "7"}
        history_response = requests.get(
            history_url, headers=headers, params=history_params
        )
        prices_7days = history_response.json().get("prices", [])

        # Performing calculations
        current_price = coin_data["market_data"]["current_price"]["usd"]
        market_cap = coin_data["market_data"]["market_cap"]["usd"]
        volume = coin_data["market_data"]["total_volume"]["usd"]
        liquidity_score = coin_data.get("liquidity_score", 50)

        # Calculate 7-day average and momentum
        average_price_7days = (
            sum([p[1] for p in prices_7days]) / len(prices_7days)
            if prices_7days
            else current_price
        )
        momentum = (current_price - average_price_7days) / average_price_7days

        # Strength of move based on Volume / market cap ratio
        volume_marketcap_ratio = volume / market_cap if market_cap > 0 else 0
        liquidity_factor = liquidity_score / 100

        # Formula: Direction (Momentum) * Intensity (Volume + Liquidity)
        # Capping the change at 20% to keep predictions realistic for a "forecast"
        prediction_percent = momentum * (1 + volume_marketcap_ratio) * liquidity_factor
        prediction_percent = max(min(prediction_percent, 0.2), -0.2)
        predicted_price = current_price * (1 + prediction_percent)

        # Ivestment metrics
        future_value = investment_amount * (predicted_price / current_price)
        roi_percent = ((predicted_price - current_price) / current_price) * 100
        return jsonify(
            {
                "coin": coin_id,
                "current_price": round(current_price, 2),
                "current_Marketcap": market_cap,
                "roi_percent": round(roi_percent, 2),
                "potential_value": round(future_value, 2),
                "prediction": {
                    "estimated_target": round(predicted_price, 2),
                    "confidence_score": round(liquidity_factor * 100, 1),
                    "trend": "Bullish" if prediction_percent > 0 else "Bearish",
                    "price_change_percent": round(roi_percent, 2),
                },
                "investment": {
                    "future_value": round(future_value, 2),
                    "roi_percent": round(roi_percent, 2),
                },
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    pass


@app.route("/api/target-prediction")
def target_prediction():

    try:
        coin_id = request.args.get("coin_id").lower()
        target_mcap = float(request.args.get("target_mcap"))
        investment = float(request.args.get("investment", 0))

        url = f"{COINGECKO_BASE_URL}/coins/{coin_id}"
        response = requests.get(url, headers={"x-cg-demo-api-key": API_KEY})
        data = response.json()

        current_price = data["market_data"]["current_price"]["usd"]
        circulating_supply = data["market_data"]["circulating_supply"]
        current_mcap = data["market_data"]["market_cap"]["usd"]

        target_price = target_mcap / circulating_supply
        roi_percent = ((target_price - current_price) / current_price) * 100
        potential_value = investment * (target_price / current_price)
        return jsonify(
            {
                "coin": coin_id,
                "current_price": current_price,
                "current_mcap": current_mcap,
                "target_price": round(target_price, 4),
                "target_mcap": target_mcap,
                "roi_percent": round(roi_percent, 2),
                "potential_value": round(potential_value, 2),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/history/<coin_id>")
def get_history(coin_id):
    try:
        url = f"{COINGECKO_BASE_URL}/coins/{coin_id}/market_chart"
        params = {"vs_currency": "usd", "days": "7"}
        headers = {"x-cg-demo-api-key": API_KEY}
        response = requests.get(url, headers=headers, params=params)
        data = response.json()

        return jsonify(data.get("prices", []))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
