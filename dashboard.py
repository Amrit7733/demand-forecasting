import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt

# -----------------------------------
# PAGE CONFIGURATION
# -----------------------------------

st.set_page_config(
    page_title="Demand Forecasting Dashboard",
    page_icon="📊",
    layout="wide"
)

# -----------------------------------
# DASHBOARD TITLE
# -----------------------------------

st.title("📊 Demand Forecasting & Inventory Optimization")

st.markdown(
    "### Walmart M5 Sales Forecasting Project"
)

st.write(
    "Interactive dashboard for analyzing actual sales, "
    "predicted demand, and forecasting performance."
)

# -----------------------------------
# LOAD DATA
# -----------------------------------

@st.cache_data
def load_data():
    df = pd.read_csv("oos_predictions.csv")

    df["date"] = pd.to_datetime(df["date"])

    return df


df = load_data()

# -----------------------------------
# SIDEBAR
# -----------------------------------

st.sidebar.header("Dashboard Controls")

product_list = sorted(df["id"].unique())

selected_product = st.sidebar.selectbox(
    "Select Product",
    product_list
)

# -----------------------------------
# FILTER DATA
# -----------------------------------

product_df = df[
    df["id"] == selected_product
].copy()

product_df = product_df.sort_values("date")

# -----------------------------------
# KEY PERFORMANCE INDICATORS
# -----------------------------------

st.subheader("📈 Sales Overview")

col1, col2, col3 = st.columns(3)

total_sales = product_df["sales"].sum()

average_sales = product_df["sales"].mean()

average_prediction = product_df["p50"].mean()

with col1:
    st.metric(
        "Total Actual Sales",
        f"{total_sales:,.0f}"
    )

with col2:
    st.metric(
        "Average Daily Sales",
        f"{average_sales:.2f}"
    )

with col3:
    st.metric(
        "Average Predicted Sales",
        f"{average_prediction:.2f}"
    )

# -----------------------------------
# ACTUAL VS PREDICTED GRAPH
# -----------------------------------

st.subheader("📉 Actual vs Predicted Sales")

fig, ax = plt.subplots(figsize=(14, 5))

ax.plot(
    product_df["date"],
    product_df["sales"],
    label="Actual Sales",
    color="blue"
)

ax.plot(
    product_df["date"],
    product_df["p50"],
    label="Predicted Sales",
    color="red"
)

ax.set_xlabel("Date")

ax.set_ylabel("Units Sold")

ax.set_title(
    f"Sales Forecast - {selected_product}"
)

ax.legend()

ax.grid(alpha=0.3)

plt.tight_layout()

st.pyplot(fig)

plt.close(fig)

# -----------------------------------
# FORECAST ERROR
# -----------------------------------

st.subheader("🎯 Forecast Accuracy")

mae = (
    product_df["sales"] - product_df["p50"]
).abs().mean()

st.metric(
    "Mean Absolute Error (MAE)",
    f"{mae:.3f}"
)

st.info(
    "MAE measures the average absolute difference "
    "between actual sales and predicted sales. "
    "Lower values indicate better predictions."
)

# -----------------------------------
# DATA TABLE
# -----------------------------------

st.subheader("📋 Prediction Data")

st.dataframe(
    product_df[
        ["date", "sales", "p50"]
    ],
    use_container_width=True
)

# -----------------------------------
# DOWNLOAD BUTTON
# -----------------------------------

csv = product_df.to_csv(index=False)

st.download_button(
    label="Download Product Predictions",
    data=csv,
    file_name="product_predictions.csv",
    mime="text/csv"
)

# -----------------------------------
# FOOTER
# -----------------------------------

st.markdown("---")

st.caption(
    "Demand Forecasting & Inventory Optimization "
    "| Walmart M5 Dataset | Data Science Portfolio"
)