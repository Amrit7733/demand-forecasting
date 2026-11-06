import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from pathlib import Path

st.set_page_config(page_title='Demand Intelligence | M5', page_icon='📈', layout='wide')
st.markdown('''<style>
.stApp {background:radial-gradient(ellipse at 85% 0%,#301324 0%,#0a0d16 45%,#070910 100%);color:#f5f6fb;}
.block-container {padding-top:2rem;padding-bottom:3rem;max-width:1450px;}
[data-testid="stHeader"] {background:rgba(8,10,17,.7);}
[data-testid="stSidebar"] {background:linear-gradient(180deg,#231528,#101420 65%,#0b0e17);border-right:1px solid #633149;}
[data-testid="stSidebar"] h2 {color:white!important;}
[data-testid="stSidebar"] label {color:#d8dce8!important;font-weight:600;}
[data-testid="stSidebar"] [data-baseweb="select"]>div,[data-testid="stSidebar"] [data-testid="stDateInput"] input {background:#251e2e!important;border:1px solid #80415b!important;border-radius:10px!important;color:white!important;}
h1 {font-size:clamp(2rem,3.3vw,3.5rem)!important;font-weight:800!important;letter-spacing:-.04em;color:#fff!important;}
h2,h3 {color:#f5f6fa!important;}
[data-testid="stMetric"] {background:linear-gradient(145deg,#202130,#131622);border:1px solid #573047;border-top:2px solid #ff456d;padding:20px;border-radius:18px;box-shadow:0 10px 35px #0005,0 0 18px #fb365711;}
[data-testid="stMetricLabel"] {color:#c1c8d8;}
[data-testid="stMetricValue"] {color:#fff;font-weight:800;}
[data-testid="stDownloadButton"] button {background:linear-gradient(90deg,#d9214e,#a91338)!important;color:white!important;border:1px solid #f25376!important;border-radius:12px!important;font-weight:700;}
[data-testid="stDataFrame"] {border:1px solid #493044;border-radius:14px;overflow:hidden;}
</style>''', unsafe_allow_html=True)

@st.cache_data
def load_data():
    path = Path(__file__).resolve().parent / 'oos_predictions.csv'
    if not path.exists():
        st.error('Missing oos_predictions.csv. Keep it beside dashboard.py in the repository.')
        st.stop()
    data = pd.read_csv(path)
    required = {'id', 'date', 'sales', 'p50'}
    missing = required - set(data.columns)
    if missing:
        st.error(f'Missing columns in CSV: {", ".join(sorted(missing))}')
        st.stop()
    data['date'] = pd.to_datetime(data['date'], errors='coerce')
    data['sales'] = pd.to_numeric(data['sales'], errors='coerce')
    data['p50'] = pd.to_numeric(data['p50'], errors='coerce')
    return data.dropna(subset=['id', 'date', 'sales', 'p50']).sort_values('date')

df = load_data()
if df.empty:
    st.warning('No valid prediction rows found.')
    st.stop()

st.caption('●  FORECAST ANALYTICS / WALMART M5')
st.title('◈ DEMAND INTELLIGENCE')
st.caption('Walmart M5 • Out-of-sample forecasting analytics • Portfolio demo')
st.sidebar.markdown('### ◈ CONTROL CENTER')
st.sidebar.caption('DEMAND INTELLIGENCE · V3')
st.sidebar.divider()
st.sidebar.header('Explore forecasts')
products = sorted(df['id'].astype(str).unique())
selected_product = st.sidebar.selectbox('Product', products)
product_df = df.loc[df['id'].astype(str) == selected_product].copy()
start, end = product_df['date'].min().date(), product_df['date'].max().date()
selected_range = st.sidebar.date_input('Date range', value=(start, end), min_value=start, max_value=end)
if isinstance(selected_range, (tuple, list)) and len(selected_range) == 2:
    a, b = selected_range
    product_df = product_df[product_df['date'].dt.date.between(a, b)]
if product_df.empty:
    st.info('No observations in this date range. Adjust the filter.')
    st.stop()

actual = product_df['sales'].to_numpy(dtype=float)
pred = product_df['p50'].to_numpy(dtype=float)
error = actual - pred
mae = np.mean(np.abs(error))
rmse = np.sqrt(np.mean(error ** 2))
wape = np.sum(np.abs(error)) / np.sum(np.abs(actual)) * 100 if np.sum(np.abs(actual)) > 0 else np.nan
bias = np.mean(pred - actual)

st.subheader('⚡ Forecast performance')
c1, c2, c3, c4 = st.columns(4)
c1.metric('Actual units', f'{actual.sum():,.0f}')
c2.metric('Predicted units', f'{pred.sum():,.0f}')
c3.metric('MAE (units/day)', f'{mae:.2f}')
c4.metric('WAPE', f'{wape:.1f}%' if np.isfinite(wape) else 'N/A')

fig = go.Figure()
fig.add_trace(go.Scatter(x=product_df['date'], y=actual, mode='lines+markers', name='Actual sales', line=dict(color='#f2f4f8', width=2)))
fig.add_trace(go.Scatter(x=product_df['date'], y=pred, mode='lines+markers', name='Predicted (p50)', line=dict(color='#fb3657', width=2)))
fig.update_layout(template='plotly_dark', paper_bgcolor='#111521', plot_bgcolor='#111521', title=f'Actual vs predicted · {selected_product}', xaxis_title='Date', yaxis_title='Units sold', hovermode='x unified', margin=dict(l=20,r=20,t=60,b=20))
st.plotly_chart(fig, use_container_width=True)

left, right = st.columns(2)
with left:
    st.subheader('🎯 Error diagnostics')
    st.metric('RMSE (units/day)', f'{rmse:.2f}')
    st.metric('Mean prediction bias (units/day)', f'{bias:+.2f}')
    st.caption('Positive bias means overforecasting; negative bias means underforecasting.')
with right:
    residual_fig = go.Figure(go.Bar(x=product_df['date'], y=error, marker_color=['#fb3657' if v < 0 else '#64748b' for v in error]))
    residual_fig.update_layout(template='plotly_dark', paper_bgcolor='#111521', plot_bgcolor='#111521', title='Residuals: actual − predicted', xaxis_title='Date', yaxis_title='Units', margin=dict(l=20,r=20,t=60,b=20))
    st.plotly_chart(residual_fig, use_container_width=True)

st.subheader('📋 Prediction records')
st.dataframe(product_df[['date', 'sales', 'p50']], use_container_width=True, hide_index=True)
st.download_button('Download filtered predictions', product_df.to_csv(index=False).encode('utf-8'), 'product_predictions.csv', 'text/csv')
st.caption('Metrics are descriptive for the selected out-of-sample records. They do not establish causal impact or real-time inference.')
