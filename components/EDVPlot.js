'use client';
import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';

function EDVPlot() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    function generateNormalData(n, mean, sd) {
      return Array.from({ length: n }, () => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + sd * z;
      });
    }

    const menBSA = generateNormalData(833, 1.9, 0.2);
    const menEDV = generateNormalData(833, 133, 32);
    const womenBSA = generateNormalData(756, 1.6, 0.2);
    const womenEDV = generateNormalData(756, 107, 23);


    const menData = menBSA.map((bsa, i) => ({
      sex: 'Men',
      bsa,
      edv: menEDV[i],
      edvIndexed: menEDV[i] / bsa
    })).sort((a, b) => a.bsa - b.bsa);

    const womenData = womenBSA.map((bsa, i) => ({
      sex: 'Women',
      bsa,
      edv: womenEDV[i],
      edvIndexed: womenEDV[i] / bsa
    })).sort((a, b) => a.bsa - b.bsa);

    setData([...menData, ...womenData]);

    // Add after data generation in useEffect:
    function correlationCoefficient(x, y) {
      const n = x.length;
      const meanX = x.reduce((a, b) => a + b) / n;
      const meanY = y.reduce((a, b) => a + b) / n;
      const numerator = x.map((xi, i) => (xi - meanX) * (y[i] - meanY)).reduce((a, b) => a + b);
      const denominator = Math.sqrt(
        x.map(xi => Math.pow(xi - meanX, 2)).reduce((a, b) => a + b) *
        y.map(yi => Math.pow(yi - meanY, 2)).reduce((a, b) => a + b)
      );
      return numerator / denominator;
    }

  

    // Calculate correlations
    const menCorrs = {
      raw: correlationCoefficient(menData.map(d => d.bsa), menData.map(d => d.edv)),
      indexed: correlationCoefficient(menData.map(d => d.bsa), menData.map(d => d.edvIndexed))
    };

    const womenCorrs = {
      raw: correlationCoefficient(womenData.map(d => d.bsa), womenData.map(d => d.edv)),
      indexed: correlationCoefficient(womenData.map(d => d.bsa), womenData.map(d => d.edvIndexed))
    };

    setStats({ menCorrs, womenCorrs });
  }, []);

  function downloadCSV(data) {
    const csvContent = [
      ['sex', 'bsa', 'edv', 'edv_indexed'].join(','),
      ...data.map(row => [row.sex, row.bsa, row.edv, row.edvIndexed].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edv_data.csv';
    a.click();
  }

  return (
    <div style={{ width: '100%', height: 800 }}>
      <div style={{ height: '50%', marginBottom: 20 }}>
        <h3>EDV vs BSA</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 60, bottom: 40, left: 60 }}>
            <CartesianGrid />
            <XAxis
              dataKey="bsa"
              domain={[0.0, 2.7]}
              ticks={[0.5, 1.0, 1.5, 2.0, 2.5]}
              // tickFormatter={(value) => value.toFixed(1)}
              // interval={100}
              // tickCount={10}
              scale="linear"
              type="number"
              label={{ value: 'BSA (m²)', position: 'bottom', offset: 20 }}
            />
            <YAxis
              dataKey="edv"
              domain={[0, 300]}
              tickFormatter={(value) => Math.round(value)}
              label={{ value: 'EDV (mL)', angle: -90, position: 'left', offset: 40 }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Scatter data={data.filter(d => d.sex === 'Men')} fill="#8884d8" name="Men" />
            <Scatter data={data.filter(d => d.sex === 'Women')} fill="#82ca9d" name="Women" />
            <Scatter
              name="Men ULN"
              data={[{ bsa: 0.8, edv: 0.8 * 79 }, { bsa: 2.7, edv: 2.7 * 79 }]}
              line={{ stroke: '#8884d8', strokeDasharray: '5 5' }}
              shape={() => null}
            />
            <Scatter
              name="Women ULN"
              data={[{ bsa: 0.8, edv: 0.8 * 72.3 }, { bsa: 2.7, edv: 2.7 * 72.3 }]}
              line={{ stroke: '#82ca9d', strokeDasharray: '5 5' }}
              shape={() => null}
            />

          </ScatterChart>
        </ResponsiveContainer>      </div>

      <div style={{ height: '50%' }}>
        <h3>Indexed EDV vs BSA</h3>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 60, bottom: 40, left: 60 }}>
            <CartesianGrid />
            <XAxis
              dataKey="bsa"
              domain={[0.0, 2.7]}
              ticks={[0.5, 1.0, 1.5, 2.0, 2.5]}
              // tickFormatter={(value) => value.toFixed(1)}
              // interval={100}
              // tickCount={10}
              scale="linear"
              type="number"
              label={{ value: 'BSA (m²)', position: 'bottom', offset: 20 }}
            />
            <YAxis dataKey="edvIndexed" domain={[0, 200]} label={{ value: 'EDV/BSA (mL/m²)', angle: -90, position: 'left', offset: 40 }} tickFormatter={(value) => value.toFixed(0)} />
            <Tooltip />
            <Scatter data={data.filter(d => d.sex === 'Men')} fill="#8884d8" name="Men" />
            <Scatter data={data.filter(d => d.sex === 'Women')} fill="#82ca9d" name="Women" />
            <ReferenceLine y={79} stroke="#8884d8" strokeDasharray="5 5" />
            <ReferenceLine y={72.3} stroke="#82ca9d" strokeDasharray="5 5" />
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ marginTop: '20px', fontFamily: 'monospace' }}>
          <h3>Correlation Analysis</h3>
          {stats && (
            <>
              <p>Men - Raw EDV vs BSA: {stats.menCorrs.raw.toFixed(3)}</p>
              <p>Men - Indexed EDV vs BSA: {stats.menCorrs.indexed.toFixed(3)}</p>
              <p>Women - Raw EDV vs BSA: {stats.womenCorrs.raw.toFixed(3)}</p>
              <p>Women - Indexed EDV vs BSA: {stats.womenCorrs.indexed.toFixed(3)}</p>
            </>
          )}
        </div>
        <button
          onClick={() => downloadCSV(data)}
          style={{
            padding: '10px 20px',
            marginTop: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Download Data
        </button>
      </div>
    </div>
  );
}

export default EDVPlot;