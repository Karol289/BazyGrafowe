import threading
import tkinter as tk
from tkinter import scrolledtext, messagebox, filedialog
import tkinter.ttk as ttk
from gui_theme import BG_COLOR, FG_COLOR, ACCENT_COLOR, BTN_COLOR, BTN_HOVER, ERROR_COLOR, SUCCESS_COLOR, STATUS_BG, STATUS_FG, FONT, MONO_FONT
from util import run_llm_on_description, parse_json_response, run_neo4j_save, NEO4J_URL, NEO4J_WEB_URL
import networkx as nx
import matplotlib.pyplot as plt
from neo4j import GraphDatabase
import webbrowser

def gui_mode(llm):
    root = tk.Tk()
    root.title("Ekstraktor danych sieci wodociągowych")
    root.configure(bg=BG_COLOR)
    window_width = 820
    window_height = 750
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    x = (screen_width // 2) - (window_width // 2)
    y = (screen_height // 2) - (window_height // 2)
    root.geometry(f"{window_width}x{window_height}+{x}+{y}")
    root.resizable(True, True)

    style = ttk.Style()
    style.theme_use('clam')
    style.configure('TButton', font=FONT, background=BTN_COLOR, foreground=FG_COLOR, borderwidth=0, focusthickness=3, focuscolor=ACCENT_COLOR, padding=8)
    style.map('TButton', background=[('active', BTN_HOVER)])

    def set_output_state(state):
        output_text.config(state=state)

    def on_generate():
        opis = input_text.get("1.0", tk.END).strip()
        if not opis:
            messagebox.showerror("Błąd", "Wprowadź opis wodociągu.")
            return
        generate_btn.config(state=tk.DISABLED)
        send_btn.config(state=tk.DISABLED)
        set_output_state(tk.NORMAL)
        output_text.delete("1.0", tk.END)
        output_text.insert(tk.END, "Czekaj... Generowanie JSON przez LLM...")
        set_output_state(tk.DISABLED)
        def llm_thread():
            response = run_llm_on_description(opis, llm)
            def update_output():
                set_output_state(tk.NORMAL)
                output_text.delete("1.0", tk.END)
                output_text.insert(tk.END, response)
                set_output_state(tk.NORMAL)
                generate_btn.config(state=tk.NORMAL)
                send_btn.config(state=tk.NORMAL)
            root.after(0, update_output)
        threading.Thread(target=llm_thread, daemon=True).start()

    def on_send():
        response = output_text.get("1.0", tk.END).strip()
        data, err = parse_json_response(response)
        if err:
            messagebox.showerror("Błąd", f"Błąd dekodowania JSON: {err}")
            return
        send_btn.config(state=tk.DISABLED)
        set_output_state(tk.DISABLED)
        result_label.config(text="Czekaj... Zapis do Neo4j...", fg=ACCENT_COLOR)
        def neo4j_thread():
            success, msg = run_neo4j_save(data)
            def update_result():
                set_output_state(tk.NORMAL)
                send_btn.config(state=tk.NORMAL)
                result_label.config(text=msg, fg=SUCCESS_COLOR if success else ERROR_COLOR)
                if success:
                    messagebox.showinfo("Sukces", "Dane zostały zapisane do bazy Neo4j.")
                else:
                    messagebox.showerror("Błąd", f"Nie udało się zapisać do Neo4j: {msg}")
            root.after(0, update_result)
        threading.Thread(target=neo4j_thread, daemon=True).start()

    def load_from_file():
        file_path = filedialog.askopenfilename(
            title="Wybierz plik z opisem",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                input_text.delete("1.0", tk.END)
                input_text.insert(tk.END, content)
                messagebox.showinfo("Sukces", f"Załadowano plik: {file_path}")
            except Exception as e:
                messagebox.showerror("Błąd", f"Błąd podczas wczytywania pliku: {e}")

    def show_graph():
        try:
            driver = GraphDatabase.driver('bolt://localhost:7687', auth=("neo4j", "12345678"))
            with driver.session() as session:
                db_name = session.run("CALL db.info() YIELD name RETURN name").single()["name"]
                nodes = session.run("MATCH (n) RETURN n")
                edges = session.run("MATCH (a)-[r]->(b) RETURN a, b, r")
                G = nx.DiGraph()
                for record in nodes:
                    node = record["n"]
                    G.add_node(node["id"], label=node.get("type", ""))
                for record in edges:
                    a = record["a"]["id"]
                    b = record["b"]["id"]
                    rel = list(record["r"].types())[0] if hasattr(record["r"], 'types') else "rel"
                    G.add_edge(a, b, label=rel)
            plt.figure(figsize=(10, 8))
            fig = plt.gcf()
            fig.canvas.manager.set_window_title(f"Neo4j: {db_name}")
            ax = plt.gca()
            ax.set_facecolor('#23272e')
            fig.patch.set_facecolor('#23272e')
            pos = nx.spring_layout(G, seed=42)
            # Draw edges
            nx.draw_networkx_edges(G, pos, edge_color="#61afef", width=2, arrows=True, arrowstyle='-|>', connectionstyle='arc3,rad=0.08')
            # Draw nodes with glow
            for n in G.nodes():
                x, y = pos[n]
                ax.scatter(x, y, s=2600, color="#181a1f", alpha=0.8, zorder=1)
                ax.scatter(x, y, s=1800, color="#61afef", alpha=0.95, zorder=2)
            # Draw node labels
            nx.draw_networkx_labels(G, pos, font_size=16, font_color="#f8f8f2", font_weight='bold', font_family='Segoe UI')
            # Draw edge labels
            edge_labels = nx.get_edge_attributes(G, 'label')
            nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_color="#e06c75", font_size=12, font_family='Consolas')
            plt.title(f"Wizualizacja grafu bazy: {db_name}", color="#61afef", fontsize=18, fontweight='bold', pad=20)
            plt.axis('off')
            plt.tight_layout()
            plt.show()
        except Exception as e:
            messagebox.showerror("Błąd wizualizacji", f"Nie udało się pobrać lub wyświetlić grafu: {e}")

    def open_neo4j():
        webbrowser.open(NEO4J_WEB_URL)

    title = tk.Label(root, text="Ekstraktor danych sieci wodociągowych", font=("Segoe UI", 22, "bold"), fg=ACCENT_COLOR, bg=BG_COLOR)
    title.pack(pady=(18, 2))
    subtitle = tk.Label(root, text="Konwersja tekstu do bazy grafowej Neo4j", font=("Segoe UI", 13), fg=STATUS_FG, bg=BG_COLOR)
    subtitle.pack(pady=(0, 10))

    input_row = tk.Frame(root, bg=BG_COLOR)
    input_row.pack(fill='x', padx=18, pady=(0, 0))
    input_label = tk.Label(input_row, text="Opis wodociągu:", font=("Segoe UI", 13, "bold"), fg=ACCENT_COLOR, bg=BG_COLOR)
    input_label.pack(side='left', anchor='w')
    file_btn = ttk.Button(input_row, text="Wczytaj z pliku", command=load_from_file)
    file_btn.pack(side='right')
    underline = tk.Frame(root, bg=ACCENT_COLOR, height=2)
    underline.pack(fill='x', padx=18, pady=(0, 6))
    input_text = scrolledtext.ScrolledText(root, height=5, width=90, font=FONT, bg=BTN_COLOR, fg=FG_COLOR, insertbackground=ACCENT_COLOR, borderwidth=0, highlightthickness=1, highlightbackground=ACCENT_COLOR)
    input_text.pack(padx=18, pady=(0, 8))

    btn_frame = tk.Frame(root, bg=BG_COLOR)
    btn_frame.pack(pady=(0, 8))
    generate_btn = ttk.Button(btn_frame, text="Generuj JSON", command=on_generate)
    generate_btn.grid(row=0, column=0, padx=6)

    output_label = tk.Label(root, text="Wynikowy JSON (możesz edytować przed wysłaniem do Neo4j):", font=("Segoe UI", 13, "bold"), fg=ACCENT_COLOR, bg=BG_COLOR)
    output_label.pack(anchor="w", padx=18)
    output_underline = tk.Frame(root, bg=ACCENT_COLOR, height=2)
    output_underline.pack(fill='x', padx=18, pady=(0, 6))
    output_text = scrolledtext.ScrolledText(root, height=14, width=90, font=MONO_FONT, bg='#181a1f', fg=FG_COLOR, insertbackground=ACCENT_COLOR, borderwidth=0, highlightthickness=1, highlightbackground=ACCENT_COLOR)
    output_text.pack(padx=18, pady=(0, 20))

    result_label = tk.Label(root, text="", font=FONT, bg=BG_COLOR, fg=FG_COLOR)
    result_label.pack(pady=(0, 2))

    btn_graph_frame = tk.Frame(root, bg=BG_COLOR)
    btn_graph_frame.pack(pady=(0, 16))
    send_btn = ttk.Button(btn_graph_frame, text="Wyślij do Neo4j", command=on_send)
    send_btn.pack(side='left', padx=8)
    show_graph_btn = ttk.Button(btn_graph_frame, text="Pokaż graf", command=show_graph)
    show_graph_btn.pack(side='left', padx=8)
    open_neo4j_btn = ttk.Button(btn_graph_frame, text="Otwórz Neo4j", command=open_neo4j)
    open_neo4j_btn.pack(side='left', padx=8)

    def on_enter(e):
        e.widget.config(cursor="hand2")
    def on_leave(e):
        e.widget.config(cursor="arrow")
    for btn in (generate_btn, send_btn, file_btn, show_graph_btn, open_neo4j_btn):
        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)

    root.mainloop()
