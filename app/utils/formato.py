def formatear_precio(valor: float) -> str:
    return f"Bs {valor:,.2f}"


def formatear_pedido_whatsapp(pedido_id: str, detalles: list, total: float) -> str:
    lineas = [f"🍽️ *Pedido #{pedido_id[:8]}*", ""]
    for d in detalles:
        lineas.append(f"• {d['cantidad']}x {d['producto_nombre']} — {formatear_precio(d['subtotal'])}")
    lineas.append(f"\n*Total: {formatear_precio(total)}*")
    return "\n".join(lineas)
