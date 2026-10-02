#!/usr/bin/env python3
"""Draw M7 figures 1-3 from figure-data.json (written by m7_figures.mjs). No numbers are computed here.

Usage: m7_plot.py <figure-data.json> <out-dir>
Writes fig1-trust-level, fig2-rule-a-score, fig3-s-per-cycle as .svg and .png.
"""
import json
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

matplotlib.rcParams["svg.hashsalt"] = "m7"  # stable ids, so the SVGs regenerate byte for byte
matplotlib.rcParams["font.size"] = 10

LINES = ["line-0", "honest", "pressure", "cheater"]
STYLE = {  # Okabe-Ito colours, distinct markers so overlapping lines stay readable
    "line-0": dict(color="#666666", marker="x", linestyle=":"),
    "honest": dict(color="#009E73", marker="o", linestyle="-"),
    "pressure": dict(color="#CC79A7", marker="^", linestyle="--"),
    "cheater": dict(color="#D55E00", marker="s", linestyle="-."),
}


def save(fig, out, name):
    for ext in ("svg", "png"):
        fig.savefig(f"{out}/{name}.{ext}", dpi=150, bbox_inches="tight", metadata={"Date": None} if ext == "svg" else None)
    plt.close(fig)


def threshold(ax, y, text, dy):
    ax.axhline(y, color="#999999", linewidth=1, linestyle="--")
    ax.text(10.3, y + dy, text, va="bottom", fontsize=9, color="#555555")


def fig1(data, out):
    fig, axes = plt.subplots(2, 2, sharex=True, sharey=True, figsize=(9, 6))
    for ax, line in zip(axes.flat, LINES):
        s = data["lines"][line]
        ax.plot(data["cycles"], s["levelA"], color="#444444", marker="o", markersize=10, markerfacecolor="none",
                linewidth=1.6, label="Rule A (call-based)")
        ax.plot(data["cycles"], s["levelB"], color="#0072B2", marker="s", markersize=5, linewidth=1.6,
                label="Rule B (outcome-based)")
        ax.set_title(line, loc="left")
        ax.set_yticks([0, 1, 2, 3], ["L0", "L1", "L2", "L3"])
        ax.set_xticks(data["cycles"])
        ax.set_ylim(-0.3, 3.3)
        ax.grid(alpha=0.25)
    for ax in axes[1]:
        ax.set_xlabel("cycle")
    handles, labels = axes[0][0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower center", ncol=2, frameon=False, bbox_to_anchor=(0.5, -0.03))
    fig.suptitle("Recommended permission level per cycle (shadow mode, main split)")
    fig.tight_layout(rect=(0, 0.02, 1, 0.97))
    save(fig, out, "fig1-trust-level")


def fig2(data, out):
    fig, ax = plt.subplots(figsize=(8, 4.5))
    for line in LINES:
        ax.plot(data["cycles"], data["lines"][line]["scoreA"], label=line, **STYLE[line])
    threshold(ax, 60, "L2 from 60", 0.5)
    threshold(ax, 80, "L3 from 80", 0.5)
    ax.set_xticks(data["cycles"])
    ax.set_xlim(0.7, 12.0)
    ax.set_ylim(48, 82)
    ax.set_xlabel("cycle")
    ax.set_ylabel("Rule A score")
    ax.set_title("Rule A score per cycle (50 + floor(allowed calls / 100); no denials occurred)", loc="left")
    ax.grid(alpha=0.25)
    ax.legend(frameon=False, loc="center left")
    fig.tight_layout()
    save(fig, out, "fig2-rule-a-score")


def fig3(data, out):
    fig, ax = plt.subplots(figsize=(8, 4.5))
    for line in LINES:
        ax.plot(data["cycles"], data["lines"][line]["S"], label=line, **STYLE[line])
    up, down = data["thresholds"]["up"], data["thresholds"]["down"]
    threshold(ax, up, f"\u03b8_up = {up:g}", 0.012)
    threshold(ax, down, f"\u03b8_down = {down:g}", 0.012)
    ax.set_xticks(data["cycles"])
    ax.set_xlim(0.7, 12.3)
    ax.set_ylim(-0.05, 1.05)
    ax.set_xlabel("cycle")
    ax.set_ylabel("S = 0.6 C + 0.4 F")
    ax.set_title("Rule B score S per cycle\n(promotion also needs B \u2264 \u03b2; any hack demotes by two levels)", loc="left", fontsize=10)
    ax.grid(alpha=0.25)
    ax.legend(frameon=False, loc="center left", bbox_to_anchor=(0.0, 0.3))
    fig.tight_layout()
    save(fig, out, "fig3-s-per-cycle")


def fig4(data, out):
    rows = data["stall"]
    fig, ax = plt.subplots(figsize=(8, 4.5))
    xs = [r["events"] / 1000 for r in rows]
    ax.plot(xs, [r["journalStallSec"] for r in rows], color="#0072B2", marker="o", linewidth=1.6,
            label="recorded in the journal (trust.update received_at - cycle completion)")
    driver = [(r["events"] / 1000, r["driverStallSec"]) for r in rows if r["driverStallSec"] is not None]
    if driver:
        ax.plot(*zip(*driver), color="#D55E00", marker="s", linestyle="--", linewidth=1.2,
                label="measured by the driver (logged from cycle 4)")
    for r, x in zip(rows, xs):
        ax.annotate(str(r["cycle"]), (x, r["journalStallSec"]), textcoords="offset points", xytext=(-2, -13),
                    fontsize=8, color="#0072B2", ha="center")
    ax.set_xlabel("events in the journal at cycle completion (thousands); labels are cycle numbers")
    ax.set_ylabel("completion stall (s)")
    ax.set_ylim(0, None)
    ax.set_title("Coordinator completion stall per cycle against journal size", loc="left")
    ax.grid(alpha=0.25)
    ax.legend(frameon=False, loc="upper left")
    fig.tight_layout()
    save(fig, out, "fig4-completion-stall")


if __name__ == "__main__":
    with open(sys.argv[1]) as handle:
        payload = json.load(handle)
    fig1(payload, sys.argv[2])
    fig2(payload, sys.argv[2])
    fig3(payload, sys.argv[2])
    if payload.get("stall"):
        fig4(payload, sys.argv[2])
