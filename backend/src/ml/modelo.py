import sys
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

input_data = sys.stdin.read()
data = json.loads(input_data)

def to_numeric(value):
    if value is None:
        return 0
    if isinstance(value, str):
        value = ''.join(c for c in value if c.isdigit() or c == '.')
        return float(value) if value else 0
    return float(value)

decisao = data.get("decisao", {})
historico = data.get("historico", [])

# Mapas de área e tipo
areas = ["financeiro", "operacoes", "rh", "marketing", "ti", "juridico", "p&d",
         "sustentabilidade", "compras", "atendimento", "qualidade", "riscos", "parcerias"]
tipos = ["financeira", "operacional", "pessoal", "estrategica", "marketing",
         "tecnologia", "juridica", "parcerias", "inovacao", "sustentabilidade"]

# Prepara DataFrame
if historico:
    df = pd.DataFrame(historico)
else:
    df = pd.DataFrame([{
        "area": "financeiro",
        "tipo": "financeira",
        "custos": 0,
        "lucro_estimado": 0,
        "prazos": 0,
        "produtividade": 0,
        "pontuacao": 50
    }])

# Converte valores numéricos
for col in ["custos", "lucro_estimado", "prazos", "produtividade", "pontuacao"]:
    df[col] = df[col].apply(to_numeric)

# Substitui NaN na pontuação por 50
df["pontuacao"] = df["pontuacao"].fillna(50)

# Label Encoding para áreas e tipos
le_area = LabelEncoder()
le_tipo = LabelEncoder()
le_area.fit(areas)
le_tipo.fit(tipos)

df["area_encoded"] = le_area.transform(df["area"].apply(lambda x: x if x in areas else "financeiro"))
df["tipo_encoded"] = le_tipo.transform(df["tipo"].apply(lambda x: x if x in tipos else "financeira"))

# Features e target
X = df[["area_encoded", "tipo_encoded", "custos", "lucro_estimado", "prazos", "produtividade"]].astype(float)
y = df["pontuacao"]

# Treina modelo Random Forest
modelo = RandomForestRegressor(n_estimators=200, random_state=42)
modelo.fit(X, y)

# Prepara nova decisão
nova_decisao = pd.DataFrame([{
    "area_encoded": le_area.transform([decisao.get("area", "financeiro") if decisao.get("area") in areas else "financeiro"])[0],
    "tipo_encoded": le_tipo.transform([decisao.get("tipo", "financeira") if decisao.get("tipo") in tipos else "financeira"])[0],
    "custos": to_numeric(decisao.get("impacto_previsto", {}).get("custos", 0)),
    "lucro_estimado": to_numeric(decisao.get("impacto_previsto", {}).get("lucro_estimado", 0)),
    "prazos": to_numeric(decisao.get("impacto_previsto", {}).get("prazos", 0)),
    "produtividade": to_numeric(decisao.get("impacto_previsto", {}).get("produtividade", 0)),
}])

# Faz previsão
pontuacao_prevista = modelo.predict(nova_decisao)[0]
pontuacao_prevista = float(np.clip(pontuacao_prevista, 0, 100))

# Define recomendação
if pontuacao_prevista >= 70:
    recomendacao = "Aprovar"
elif pontuacao_prevista >= 40:
    recomendacao = "Revisar"
else:
    recomendacao = "Rejeitar"

resultado = {
    "pontuacao": round(pontuacao_prevista, 2),
    "recomendacao": recomendacao,
    "justificativa": "Pontuação calculada com base em Random Forest aprendendo do histórico."
}

print(json.dumps(resultado))
