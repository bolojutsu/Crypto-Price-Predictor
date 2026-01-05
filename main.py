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


@app.route("/api/coingecko/ping")
def test_connection():
    try:
        url = f"{COINGECKO_BASE_URL}/ping"
        headers = {"x-cg-demo-api-key": API_KEY}
        response = requests.get(url, headers=headers)
        return jsonify(
            {
                "status": "success",
                "coingecko_response": response.json(),
                "status_code": response.status_code,
            }
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/coingecko/simple")
def coin_price():
    try:
        url = f"{COINGECKO_BASE_URL}/simple/price"
        parameters = request.args.to_dict()
        headers = {"x-cg-demo-api-key": API_KEY}
        response = requests.get(url, headers=headers, params=parameters)
        return jsonify(response.json(), response.status_code)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/coingecko/coins/list")
def coins_list():
    try:
        url = "https://api.coingecko.com/api/v3/coins/list"
        headers = {"x-cg-demo-api-key": API_KEY}
        response = requests.get(url, headers=headers)
        return jsonify(
            {"coingecko_response": response.json(), "Status_code": response.status_code}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict-price")
def predict_price():
    coin_id = request.args.get("coin_id", "bitcoin").lower()
    investment_amount = request.args.get("investment_amount", type=float)

    if investment_amount is None or investment_amount <= 0:
        return jsonify(
            {"Error": "Invalid investmnet amount. Must be a positive number"}
        )

    try:
        url = f"{COINGECKO_BASE_URL}/coins/{coin_id}"
        headers = {"x-cg-demo-api-key": API_KEY}

        parameters = {
            "localization": "false",
            "tickers": "false",
            "community_data": "false",
            "developer_data": "false",
            "sparkline": "false",
        }
        response = requests.get(url, headers=headers, params=parameters)
        data = response.json()

        if "error" in data or response.status_code != 200:
            return (
                jsonify({"error": "CoinGecko API Error", "details": data}),
                response.status_code,
            )

        if "market_data" not in data:
            return (
                jsonify(
                    {"Error": f"Data for {coin_id} is incomplete or coin Id is invalid"}
                ),
                404,
            )

        price = data["market_data"]["current_price"]["usd"]
        market_cap = data["market_data"]["market_cap"]["usd"]
        volume = data["market_data"]["total_volume"]["usd"]

        liquidity = data.get("market_data", {}).get("liquidity_score", 0)
        if liquidity == 0:
            liquidity = data.get("market_data", {}).get("liquidity_score", 0)

        if market_cap == 0:
            return jsonify({"error": " Market cap data unavailable for this coin"})

        volume_toMarketCap_ratio = volume / market_cap if market_cap > 0 else 0
        liquidity_factor = liquidity / 100 if liquidity > 0 else 0.5

        prediction_multiplyer = 1 + (volume_toMarketCap_ratio * liquidity_factor)
        predicted_price = price * prediction_multiplyer

        price_change_percent = ((predicted_price - price) / price) * 100
        future_value = investment_amount * (predicted_price / price)
        roi = future_value - investment_amount
        roi_percent = (roi / investment_amount) * 100

        # Get circulating supply for target calculations
        circulating_supply = data["market_data"].get("circulating_supply", 0)

        # Calculate target price and market cap based on predicted price
        # Using predicted price to calculate what market cap would be at that price
        target_mcap = (
            predicted_price * circulating_supply
            if circulating_supply > 0
            else market_cap
        )
        target_price = predicted_price

        return jsonify(
            {
                "coin": coin_id,
                "current_price": round(price, 2),
                "current_Marketcap": market_cap,
                "target_price": round(target_price, 2),
                "target_mcap": round(target_mcap, 2),
                "roi_percent": round(roi_percent, 2),
                "potential_value": round(future_value, 2),
                "current_metrics": {
                    "price": round(price, 2),
                    "market_cap": market_cap,
                    "volume": volume,
                    "liquidity_score": liquidity,
                },
                "prediction": {
                    "estimated_target": round(predicted_price, 2),
                    "confidence_score": round(liquidity_factor * 100, 1),
                    "trend": "Bullish" if predicted_price > price else "Neutral",
                    "price_change_percent": round(price_change_percent, 2),
                },
                "investment": {
                    "amount": investment_amount,
                    "current_value": round(investment_amount, 2),
                    "future_value": round(future_value, 2),
                    "roi": round(roi, 2),
                    "roi_percent": round(roi_percent, 2),
                    "potential_gain": round(roi, 2) if roi > 0 else 0,
                    "potential_loss": round(abs(roi), 2) if roi < 0 else 0,
                },
            }
        )
    except ZeroDivisionError:
        return jsonify({"Error": "Division by Zero Error"}), 500
    except KeyError as e:
        return jsonify({"error": f"Missing data field: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/target-prediction")
def target_prediction():

    try:

        coin_id = request.args.get("coin_id").lower()
        target_marketCap = float(request.args.get("target_mcap"))
        investment = float(request.args.get("investment", 0))

        url = f"{COINGECKO_BASE_URL}/coins/{coin_id}"
        response = requests.get(url, headers={"x-cg-demo-api-key": API_KEY})
        data = response.json()

        current_price = data["market_data"]["current_price"]["usd"]
        circulating_supply = data["market_data"]["circulating_supply"]
        current_marketCap = data["market_data"]["market_cap"]["usd"]

        target_price = target_marketCap / circulating_supply

        roi_percent = ((target_price - current_price) / current_price) * 100
        potential_value = investment * (target_price / current_price)
        return jsonify(
            {
                "coin": coin_id,
                "current_price": current_price,
                "current_mcap": current_marketCap,
                "target_price": round(target_price, 4),
                "target_mcap": target_marketCap,
                "roi_percent": round(roi_percent, 2),
                "potential_value": round(potential_value, 2),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
