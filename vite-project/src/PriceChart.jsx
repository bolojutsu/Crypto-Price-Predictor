import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PriceChart = ({ data }) => {
    const formattedData = data.map(item => ({
        time: new Date(item[0]).toLocaleDateString(),
        price: item[1]
    }));

    return (
        <div className="card" style={{ height: '300px', marginTop: '20px', width: '100%' }}>
            <h3>7-Day Price History</h3>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="time" stroke="#848e9c" fontSize={12} />
                    <YAxis
                        domain={['auto', 'auto']}
                        stroke="#848e9c"
                        fontSize={12}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #444' }}
                        itemStyle={{ color: '#f0b90b' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#f0b90b"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default PriceChart