/* ============================================
   D3.js Chart Utilities
   Warm, organic chart style
   ============================================ */

const Charts = (function () {
  'use strict';

  const palette = {
    sage: '#2B6B5E',
    terracotta: '#C45B3E',
    gold: '#D4A853',
    steel: '#5B7FA5',
    purple: '#8B6E99',
    border: '#E0DDD6',
    borderLight: '#EBE9E4',
    textPrimary: '#1A1A1A',
    textSecondary: '#5C5C5C',
    textTertiary: '#8A8A8A',
    bgSecondary: '#F0EEEA',
  };

  function createTooltip(container) {
    let tooltip = container.querySelector('.chart-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip';
      container.appendChild(tooltip);
    }
    return {
      show(html, x, y) {
        tooltip.innerHTML = html;
        tooltip.classList.add('visible');
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
      },
      hide() {
        tooltip.classList.remove('visible');
      },
    };
  }

  function responsiveWidth(container) {
    return container.getBoundingClientRect().width;
  }

  /* --- Horizontal Bar Chart --- */
  function barChart(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof d3 === 'undefined') return;

    const {
      colors = [palette.sage, palette.terracotta, palette.gold, palette.steel, palette.purple],
      valueLabel = (d) => d.value + '%',
      barHeight = 44,
      animate = true,
    } = options;

    const margin = { top: 8, right: 60, bottom: 24, left: 110 };
    const width = responsiveWidth(container) - margin.left - margin.right;
    const height = data.length * (barHeight + 12) + margin.top + margin.bottom;

    d3.select(container).select('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.25);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisBottom(x).ticks(5).tickSize(height - margin.top - margin.bottom).tickFormat('')
      )
      .attr('transform', `translate(0,0)`);

    // Labels
    g.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', -12)
      .attr('y', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'Source Sans 3', sans-serif")
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', palette.textSecondary)
      .text((d) => d.label);

    const tip = createTooltip(container);

    // Bars
    const bars = g
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (d) => y(d.label))
      .attr('height', y.bandwidth())
      .attr('rx', 3)
      .attr('fill', (d, i) => colors[i % colors.length])
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.85);
        const rect = container.getBoundingClientRect();
        const mx = event.clientX - rect.left;
        const my = event.clientY - rect.top - 36;
        tip.show(`<strong>${d.label}</strong>: ${valueLabel(d)}`, mx, my);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        tip.hide();
      });

    if (animate) {
      bars
        .attr('width', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .ease(d3.easeCubicOut)
        .attr('width', (d) => x(d.value));
    } else {
      bars.attr('width', (d) => x(d.value));
    }

    // Value labels
    const valLabels = g
      .selectAll('.val-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'val-label')
      .attr('y', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('dominant-baseline', 'central')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', palette.textPrimary)
      .text((d) => valueLabel(d));

    if (animate) {
      valLabels
        .attr('x', 8)
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 100 + 400)
        .ease(d3.easeCubicOut)
        .attr('x', (d) => x(d.value) + 10)
        .attr('opacity', 1);
    } else {
      valLabels.attr('x', (d) => x(d.value) + 10);
    }
  }

  /* --- Grouped Bar Chart (comparison) --- */
  function groupedBarChart(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof d3 === 'undefined') return;

    const {
      groups = [],
      colors = [palette.sage, palette.terracotta],
      valueLabel = (d) => d + '%',
      animate = true,
    } = options;

    const margin = { top: 24, right: 24, bottom: 56, left: 48 };
    const width = responsiveWidth(container) - margin.left - margin.right;
    const height = 280;

    d3.select(container).select('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.category))
      .range([0, width])
      .padding(0.35);

    const x1 = d3.scaleBand().domain(groups).range([0, x0.bandwidth()]).padding(0.12);

    const maxVal = d3.max(data, (d) => d3.max(groups, (grp) => d[grp]));
    const y = d3
      .scaleLinear()
      .domain([0, Math.ceil(maxVal / 10) * 10])
      .range([height, 0]);

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    // X Axis
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickSize(0))
      .selectAll('text')
      .style('font-family', "'Source Sans 3', sans-serif")
      .style('font-size', '12px')
      .style('fill', palette.textSecondary)
      .attr('dy', '1em');

    g.select('.axis path').attr('stroke', palette.border);

    const tip = createTooltip(container);

    // Bars
    const catGroups = g
      .selectAll('.cat-group')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x0(d.category)},0)`);

    catGroups
      .selectAll('rect')
      .data((d) => groups.map((grp, i) => ({ group: grp, value: d[grp], category: d.category, idx: i })))
      .enter()
      .append('rect')
      .attr('x', (d) => x1(d.group))
      .attr('width', x1.bandwidth())
      .attr('rx', 2)
      .attr('fill', (d, i) => colors[i % colors.length])
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.8);
        const rect = container.getBoundingClientRect();
        tip.show(
          `<strong>${d.group}</strong><br>${d.category}: ${valueLabel(d.value)}`,
          event.clientX - rect.left,
          event.clientY - rect.top - 44
        );
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        tip.hide();
      })
      .attr('y', animate ? height : (d) => y(d.value))
      .attr('height', animate ? 0 : (d) => height - y(d.value))
      .transition()
      .duration(animate ? 800 : 0)
      .delay((d, i) => (animate ? i * 120 : 0))
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => height - y(d.value));

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left + width - groups.length * 120},${height + margin.top + 42})`);

    groups.forEach((grp, i) => {
      const lg = legend.append('g').attr('transform', `translate(${i * 130},0)`);
      lg.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('fill', colors[i]);
      lg.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-family', "'Source Sans 3', sans-serif")
        .style('font-size', '12px')
        .style('fill', palette.textSecondary)
        .text(grp);
    });
  }

  /* --- Lollipop Chart (horizontal stem + dot) --- */
  function lollipopChart(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof d3 === 'undefined') return;

    const {
      colors = [palette.sage],
      valueLabel = (d) => d.value + '%',
      dotRadius = 6,
      rowHeight = 40,
      animate = true,
    } = options;

    const isNarrow = responsiveWidth(container) < 420;
    const margin = { top: 12, right: isNarrow ? 48 : 72, bottom: 12, left: isNarrow ? 72 : 120 };
    const width = responsiveWidth(container) - margin.left - margin.right;
    const height = data.length * rowHeight + margin.top + margin.bottom;
    const maxVal = d3.max(data, (d) => d.value);
    const domainMax = maxVal <= 1 ? 1 : maxVal <= 10 ? Math.ceil(maxVal / 2) * 2 : maxVal <= 100 ? Math.ceil(maxVal / 10) * 10 : Math.ceil(maxVal / 200) * 200;

    d3.select(container).select('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, domainMax]).range([0, width]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.35);

    // Faint dashed vertical grid lines
    const gridValues = domainMax <= 10 ? d3.range(0, domainMax + 1, domainMax <= 2 ? 0.5 : 1).filter((v) => v > 0) : [domainMax * 0.25, domainMax * 0.5, domainMax * 0.75, domainMax];
    g.selectAll('.grid-line')
      .data(gridValues)
      .enter()
      .append('line')
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('y1', 0)
      .attr('y2', height - margin.top - margin.bottom)
      .attr('stroke', palette.borderLight)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,4');

    // Category labels (left)
    g.selectAll('.lp-label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', -14)
      .attr('y', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'Source Sans 3', sans-serif")
      .style('font-size', isNarrow ? '11px' : '13px')
      .style('font-weight', '500')
      .style('fill', palette.textSecondary)
      .text((d) => d.label);

    const tip = createTooltip(container);

    // Stems (thin lines)
    const stems = g
      .selectAll('.lp-stem')
      .data(data)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('y1', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('y2', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('stroke', palette.border)
      .attr('stroke-width', 1);

    // Dots
    const dots = g
      .selectAll('.lp-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cy', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('r', dotRadius)
      .attr('fill', (d, i) => colors[i % colors.length])
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', dotRadius + 2).attr('opacity', 0.85);
        const rect = container.getBoundingClientRect();
        tip.show(`<strong>${d.label}</strong>: ${valueLabel(d)}`, event.clientX - rect.left, event.clientY - rect.top - 36);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', dotRadius).attr('opacity', 1);
        tip.hide();
      });

    // Value labels (right of dot)
    const valLabels = g
      .selectAll('.lp-val')
      .data(data)
      .enter()
      .append('text')
      .attr('y', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('dominant-baseline', 'central')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('fill', palette.textPrimary)
      .text((d) => valueLabel(d));

    if (animate) {
      stems
        .attr('x2', 0)
        .transition()
        .duration(700)
        .delay((d, i) => i * 70)
        .ease(d3.easeCubicOut)
        .attr('x2', (d) => x(d.value));

      dots
        .attr('cx', 0)
        .attr('opacity', 0)
        .transition()
        .duration(700)
        .delay((d, i) => i * 70)
        .ease(d3.easeCubicOut)
        .attr('cx', (d) => x(d.value))
        .attr('opacity', 1);

      valLabels
        .attr('x', 8)
        .attr('opacity', 0)
        .transition()
        .duration(700)
        .delay((d, i) => i * 70 + 300)
        .ease(d3.easeCubicOut)
        .attr('x', (d) => x(d.value) + dotRadius + 8)
        .attr('opacity', 1);
    } else {
      stems.attr('x2', (d) => x(d.value));
      dots.attr('cx', (d) => x(d.value));
      valLabels.attr('x', (d) => x(d.value) + dotRadius + 8);
    }
  }

  /* --- Dumbbell Chart (two dots + connecting line) --- */
  function dumbbellChart(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof d3 === 'undefined') return;

    const {
      leftLabel = 'Group A',
      rightLabel = 'Group B',
      leftColor = palette.sage,
      rightColor = palette.terracotta,
      valueLabel = (d) => d + '%',
      dotRadius = 6,
      rowHeight = 44,
      animate = true,
    } = options;

    const isNarrow = responsiveWidth(container) < 420;
    const margin = { top: 12, right: isNarrow ? 36 : 56, bottom: 40, left: isNarrow ? 72 : 120 };
    const width = responsiveWidth(container) - margin.left - margin.right;
    const height = data.length * rowHeight + margin.top + margin.bottom;
    const allVals = data.flatMap((d) => [d.left, d.right]);
    const maxVal = d3.max(allVals);
    const domainMax = maxVal <= 5 ? Math.ceil(maxVal) : maxVal <= 50 ? Math.ceil(maxVal / 5) * 5 : Math.ceil(maxVal / 10) * 10;

    d3.select(container).select('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, domainMax]).range([0, width]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.category))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.35);

    // Faint dashed vertical grid
    const gridValues = domainMax <= 5 ? d3.range(1, domainMax + 1) : [domainMax * 0.25, domainMax * 0.5, domainMax * 0.75, domainMax];
    g.selectAll('.grid-line')
      .data(gridValues)
      .enter()
      .append('line')
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('y1', 0)
      .attr('y2', height - margin.top - margin.bottom)
      .attr('stroke', palette.borderLight)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,4');

    // Category labels
    g.selectAll('.db-label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', -14)
      .attr('y', (d) => y(d.category) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'Source Sans 3', sans-serif")
      .style('font-size', isNarrow ? '11px' : '13px')
      .style('font-weight', '500')
      .style('fill', palette.textSecondary)
      .text((d) => d.category);

    const tip = createTooltip(container);

    // Connecting lines
    const connectors = g
      .selectAll('.db-connector')
      .data(data)
      .enter()
      .append('line')
      .attr('y1', (d) => y(d.category) + y.bandwidth() / 2)
      .attr('y2', (d) => y(d.category) + y.bandwidth() / 2)
      .attr('stroke', palette.border)
      .attr('stroke-width', 1.5);

    // Left dots
    const leftDots = g
      .selectAll('.db-left')
      .data(data)
      .enter()
      .append('circle')
      .attr('cy', (d) => y(d.category) + y.bandwidth() / 2)
      .attr('r', dotRadius)
      .attr('fill', leftColor)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', dotRadius + 2);
        const rect = container.getBoundingClientRect();
        tip.show(`<strong>${leftLabel}</strong><br>${d.category}: ${valueLabel(d.left)}`, event.clientX - rect.left, event.clientY - rect.top - 44);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', dotRadius);
        tip.hide();
      });

    // Right dots
    const rightDots = g
      .selectAll('.db-right')
      .data(data)
      .enter()
      .append('circle')
      .attr('cy', (d) => y(d.category) + y.bandwidth() / 2)
      .attr('r', dotRadius)
      .attr('fill', rightColor)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', dotRadius + 2);
        const rect = container.getBoundingClientRect();
        tip.show(`<strong>${rightLabel}</strong><br>${d.category}: ${valueLabel(d.right)}`, event.clientX - rect.left, event.clientY - rect.top - 44);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', dotRadius);
        tip.hide();
      });

    // Value labels next to dots
    const leftVals = g
      .selectAll('.db-lval')
      .data(data)
      .enter()
      .append('text')
      .attr('y', (d) => y(d.category) + y.bandwidth() / 2 - 12)
      .attr('dominant-baseline', 'central')
      .attr('text-anchor', 'middle')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '10px')
      .style('font-weight', '500')
      .style('fill', leftColor)
      .text((d) => valueLabel(d.left));

    const rightVals = g
      .selectAll('.db-rval')
      .data(data)
      .enter()
      .append('text')
      .attr('y', (d) => y(d.category) + y.bandwidth() / 2 - 12)
      .attr('dominant-baseline', 'central')
      .attr('text-anchor', 'middle')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '10px')
      .style('font-weight', '500')
      .style('fill', rightColor)
      .text((d) => valueLabel(d.right));

    if (animate) {
      connectors
        .attr('x1', 0)
        .attr('x2', 0)
        .transition()
        .duration(700)
        .delay((d, i) => i * 90)
        .ease(d3.easeCubicOut)
        .attr('x1', (d) => x(Math.min(d.left, d.right)))
        .attr('x2', (d) => x(Math.max(d.left, d.right)));

      leftDots
        .attr('cx', 0)
        .attr('opacity', 0)
        .transition()
        .duration(700)
        .delay((d, i) => i * 90)
        .ease(d3.easeCubicOut)
        .attr('cx', (d) => x(d.left))
        .attr('opacity', 1);

      rightDots
        .attr('cx', 0)
        .attr('opacity', 0)
        .transition()
        .duration(700)
        .delay((d, i) => i * 90 + 100)
        .ease(d3.easeCubicOut)
        .attr('cx', (d) => x(d.right))
        .attr('opacity', 1);

      leftVals
        .attr('x', 0)
        .attr('opacity', 0)
        .transition()
        .duration(700)
        .delay((d, i) => i * 90 + 300)
        .ease(d3.easeCubicOut)
        .attr('x', (d) => x(d.left))
        .attr('opacity', 1);

      rightVals
        .attr('x', 0)
        .attr('opacity', 0)
        .transition()
        .duration(700)
        .delay((d, i) => i * 90 + 400)
        .ease(d3.easeCubicOut)
        .attr('x', (d) => x(d.right))
        .attr('opacity', 1);
    } else {
      connectors
        .attr('x1', (d) => x(Math.min(d.left, d.right)))
        .attr('x2', (d) => x(Math.max(d.left, d.right)));
      leftDots.attr('cx', (d) => x(d.left));
      rightDots.attr('cx', (d) => x(d.right));
      leftVals.attr('x', (d) => x(d.left));
      rightVals.attr('x', (d) => x(d.right));
    }

    // Legend at bottom-right
    const legend = svg
      .append('g')
      .attr('transform', `translate(${margin.left + width - 180},${height - 6})`);

    [{ label: leftLabel, color: leftColor }, { label: rightLabel, color: rightColor }].forEach((item, i) => {
      const lg = legend.append('g').attr('transform', `translate(${i * 100},0)`);
      lg.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 5).attr('fill', item.color);
      lg.append('text')
        .attr('x', 10)
        .attr('y', 1)
        .attr('dominant-baseline', 'central')
        .style('font-family', "'Source Sans 3', sans-serif")
        .style('font-size', '11px')
        .style('fill', palette.textTertiary)
        .text(item.label);
    });
  }

  /* --- Waffle Chart (10×10 dot grids) --- */
  function waffleChart(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof d3 === 'undefined') return;

    const {
      activeColors = [palette.sage],
      inactiveColor = '#E8E5DF',
      dotRadius = 4.5,
      gridSize = 10,
      gap = 2.5,
      animate = true,
      valueLabel = (d) => d.value + '%',
    } = options;

    const total = gridSize * gridSize;
    const cellSize = dotRadius * 2 + gap;
    const gridPx = gridSize * cellSize;
    const labelH = 40;
    const cols = Math.min(data.length, Math.max(1, Math.floor((responsiveWidth(container) + 24) / (gridPx + 24))));
    const rows = Math.ceil(data.length / cols);
    const padX = 24;
    const padY = 12;
    const svgW = cols * gridPx + (cols - 1) * padX;
    const svgH = rows * (gridPx + labelH + padY);

    d3.select(container).select('svg').remove();

    const containerW = responsiveWidth(container);
    const maxScaleFactor = 2.5;
    const maxWidthPx = Math.min(containerW, svgW * maxScaleFactor);

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${svgW} ${svgH}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('max-width', maxWidthPx + 'px')
      .style('display', 'block')
      .style('margin', '0 auto');

    const tip = createTooltip(container);

    data.forEach(function (item, idx) {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const ox = col * (gridPx + padX);
      const oy = row * (gridPx + labelH + padY);
      const activeCount = Math.round(Math.min(item.value, 100));
      const color = activeColors[idx % activeColors.length];

      const g = svg.append('g').attr('transform', `translate(${ox},${oy})`);

      // Dots
      for (let i = 0; i < total; i++) {
        const cx = (i % gridSize) * cellSize + dotRadius;
        const cy = Math.floor(i / gridSize) * cellSize + dotRadius;
        const isActive = i < activeCount;

        const dot = g
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', dotRadius)
          .attr('fill', isActive ? color : inactiveColor)
          .style('cursor', 'pointer');

        if (animate) {
          dot
            .attr('opacity', 0)
            .attr('r', 0)
            .transition()
            .duration(300)
            .delay(i * 6 + idx * 100)
            .ease(d3.easeCubicOut)
            .attr('opacity', 1)
            .attr('r', dotRadius);
        }
      }

      // Hover zone
      g.append('rect')
        .attr('width', gridPx)
        .attr('height', gridPx)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', function (event) {
          const rect = container.getBoundingClientRect();
          tip.show(
            `<strong>${item.label}</strong>: ${valueLabel(item)}`,
            event.clientX - rect.left,
            event.clientY - rect.top - 36
          );
        })
        .on('mouseleave', function () {
          tip.hide();
        });

      // Label
      g.append('text')
        .attr('x', gridPx / 2)
        .attr('y', gridPx + 16)
        .attr('text-anchor', 'middle')
        .style('font-family', "'Source Sans 3', sans-serif")
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', palette.textSecondary)
        .text(item.label);

      // Value
      g.append('text')
        .attr('x', gridPx / 2)
        .attr('y', gridPx + 32)
        .attr('text-anchor', 'middle')
        .style('font-family', "'JetBrains Mono', monospace")
        .style('font-size', '13px')
        .style('font-weight', '600')
        .style('fill', color)
        .text(valueLabel(item));
    });
  }

  /* --- Icon Array (dot field for "1 in X" risk) --- */
  function iconArray(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof d3 === 'undefined') return;

    const {
      highlightColor = palette.terracotta,
      baseColor = '#E8E5DF',
      dotRadius = 3.5,
      gap = 2,
      gridCols = 25,
      maxDots = 200,
      animate = true,
    } = options;

    const cellSize = dotRadius * 2 + gap;
    const cw = responsiveWidth(container);
    const isNarrow = cw < 420;
    const labelW = isNarrow ? 68 : 100;
    const rowGap = 28;
    const availW = cw - labelW - 16;
    const effectiveCols = Math.min(gridCols, Math.floor(availW / cellSize));

    // Pre-compute rows
    const rowData = data.map(function (item) {
      const total = Math.min(item.ratio || maxDots, maxDots);
      const highlighted = Math.max(0, Math.round(maxDots / (item.ratio || maxDots)));
      const gridRows = Math.ceil(total / effectiveCols);
      return { label: item.label, ratio: item.ratio, total: total, highlighted: highlighted, gridRows: gridRows };
    });

    const svgH = rowData.reduce(function (sum, r) { return sum + r.gridRows * cellSize + rowGap; }, 0) + 8;
    const svgW = labelW + effectiveCols * cellSize + 80;

    d3.select(container).select('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${svgW} ${svgH}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const tip = createTooltip(container);
    let yOffset = 8;

    rowData.forEach(function (row, rIdx) {
      const g = svg.append('g').attr('transform', `translate(${labelW},${yOffset})`);

      // Label
      svg
        .append('text')
        .attr('x', labelW - 12)
        .attr('y', yOffset + (row.gridRows * cellSize) / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .style('font-family', "'Source Sans 3', sans-serif")
        .style('font-size', '12px')
        .style('font-weight', '500')
        .style('fill', palette.textSecondary)
        .text(row.label);

      // Dots
      for (let i = 0; i < row.total; i++) {
        const cx = (i % effectiveCols) * cellSize + dotRadius;
        const cy = Math.floor(i / effectiveCols) * cellSize + dotRadius;
        const isHighlighted = i < row.highlighted;

        const dot = g
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', dotRadius)
          .attr('fill', isHighlighted ? highlightColor : baseColor);

        if (isHighlighted) {
          dot.style('cursor', 'pointer')
            .on('mouseenter', function (event) {
              d3.select(this).attr('r', dotRadius + 2);
              var rect = container.getBoundingClientRect();
              tip.show(
                '<strong>1 in ' + row.ratio.toLocaleString() + '</strong>',
                event.clientX - rect.left,
                event.clientY - rect.top - 36
              );
            })
            .on('mouseleave', function () {
              d3.select(this).attr('r', dotRadius);
              tip.hide();
            });
        }

        if (animate) {
          dot
            .attr('opacity', 0)
            .transition()
            .duration(200)
            .delay(rIdx * 200 + i * 2)
            .attr('opacity', 1);
        }
      }

      // Ratio label
      var ratioX = Math.min(row.total, effectiveCols) * cellSize + 12;
      g.append('text')
        .attr('x', ratioX)
        .attr('y', (row.gridRows * cellSize) / 2)
        .attr('dominant-baseline', 'central')
        .style('font-family', "'JetBrains Mono', monospace")
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', row.highlighted > 0 ? highlightColor : palette.textTertiary)
        .text('1 in ' + row.ratio.toLocaleString());

      yOffset += row.gridRows * cellSize + rowGap;
    });
  }

  /* --- Slope Chart (two-axis connected dots) --- */
  function slopeChart(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof d3 === 'undefined') return;

    const {
      leftLabel = 'Before',
      rightLabel = 'After',
      leftColor = palette.sage,
      rightColor = palette.terracotta,
      valueLabel = (d) => d + '%',
      dotRadius = 7,
      animate = true,
    } = options;

    const isNarrow = responsiveWidth(container) < 420;
    const margin = { top: 40, right: isNarrow ? 48 : 80, bottom: 24, left: isNarrow ? 48 : 80 };
    const width = responsiveWidth(container) - margin.left - margin.right;
    const rowHeight = 48;
    const height = data.length * rowHeight;
    const allVals = data.flatMap(function (d) { return [d.left, d.right]; });
    const minVal = d3.min(allVals);
    const maxVal = d3.max(allVals);
    const padding = (maxVal - minVal) * 0.15 || 5;

    d3.select(container).select('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const colX = [0, width];

    const y = d3
      .scalePoint()
      .domain(data.map(function (d) { return d.category; }))
      .range([0, height])
      .padding(0.5);

    // Column headers
    [{label: leftLabel, x: colX[0], color: leftColor}, {label: rightLabel, x: colX[1], color: rightColor}].forEach(function (h) {
      g.append('text')
        .attr('x', h.x)
        .attr('y', -18)
        .attr('text-anchor', 'middle')
        .style('font-family', "'Source Sans 3', sans-serif")
        .style('font-size', isNarrow ? '11px' : '13px')
        .style('font-weight', '700')
        .style('fill', h.color)
        .text(h.label);
    });

    // Faint vertical axis lines
    colX.forEach(function (cx) {
      g.append('line')
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('y1', -6)
        .attr('y2', height + 6)
        .attr('stroke', palette.borderLight)
        .attr('stroke-width', 1);
    });

    const tip = createTooltip(container);

    // Connecting lines
    const lines = g
      .selectAll('.slope-line')
      .data(data)
      .enter()
      .append('line')
      .attr('y1', function (d) { return y(d.category); })
      .attr('y2', function (d) { return y(d.category); })
      .attr('stroke', function (d) { return d.right > d.left ? rightColor : d.right < d.left ? leftColor : palette.border; })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.35);

    // Left dots
    var leftDots = g
      .selectAll('.slope-left')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', colX[0])
      .attr('cy', function (d) { return y(d.category); })
      .attr('r', dotRadius)
      .attr('fill', leftColor)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', dotRadius + 2);
        var rect = container.getBoundingClientRect();
        tip.show('<strong>' + leftLabel + '</strong><br>' + d.category + ': ' + valueLabel(d.left), event.clientX - rect.left, event.clientY - rect.top - 44);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', dotRadius);
        tip.hide();
      });

    // Right dots
    var rightDots = g
      .selectAll('.slope-right')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', colX[1])
      .attr('cy', function (d) { return y(d.category); })
      .attr('r', dotRadius)
      .attr('fill', rightColor)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', dotRadius + 2);
        var rect = container.getBoundingClientRect();
        tip.show('<strong>' + rightLabel + '</strong><br>' + d.category + ': ' + valueLabel(d.right), event.clientX - rect.left, event.clientY - rect.top - 44);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', dotRadius);
        tip.hide();
      });

    // Left value labels
    g.selectAll('.slope-lval')
      .data(data)
      .enter()
      .append('text')
      .attr('x', colX[0] - dotRadius - (isNarrow ? 4 : 8))
      .attr('y', function (d) { return y(d.category); })
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', isNarrow ? '9px' : '11px')
      .style('font-weight', '500')
      .style('fill', leftColor)
      .text(function (d) { return valueLabel(d.left); });

    // Right value labels
    g.selectAll('.slope-rval')
      .data(data)
      .enter()
      .append('text')
      .attr('x', colX[1] + dotRadius + (isNarrow ? 4 : 8))
      .attr('y', function (d) { return y(d.category); })
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', isNarrow ? '9px' : '11px')
      .style('font-weight', '500')
      .style('fill', rightColor)
      .text(function (d) { return valueLabel(d.right); });

    // Category labels (centered)
    g.selectAll('.slope-cat')
      .data(data)
      .enter()
      .append('text')
      .attr('x', width / 2)
      .attr('y', function (d) { return y(d.category) - 16; })
      .attr('text-anchor', 'middle')
      .style('font-family', "'Source Sans 3', sans-serif")
      .style('font-size', isNarrow ? '9px' : '11px')
      .style('font-weight', '500')
      .style('fill', palette.textTertiary)
      .text(function (d) { return d.category; });

    if (animate) {
      lines
        .attr('x1', colX[0])
        .attr('x2', colX[0])
        .transition()
        .duration(700)
        .delay(function (d, i) { return i * 100; })
        .ease(d3.easeCubicOut)
        .attr('x1', colX[0])
        .attr('x2', colX[1]);

      leftDots
        .attr('opacity', 0)
        .transition()
        .duration(400)
        .delay(function (d, i) { return i * 100; })
        .attr('opacity', 1);

      rightDots
        .attr('opacity', 0)
        .transition()
        .duration(400)
        .delay(function (d, i) { return i * 100 + 350; })
        .attr('opacity', 1);
    }
  }

  /* --- Butterfly Chart (center-axis diverging bars) --- */
  function butterflyChart(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof d3 === 'undefined') return;

    const {
      leftLabel = 'Group A',
      rightLabel = 'Group B',
      leftColor = palette.sage,
      rightColor = palette.terracotta,
      valueLabel = (d) => d + '%',
      rowHeight = 44,
      animate = true,
    } = options;

    const allVals = data.flatMap(function (d) { return [d.left, d.right]; });
    const maxVal = d3.max(allVals);
    const domainMax = maxVal <= 5 ? Math.ceil(maxVal) : maxVal <= 50 ? Math.ceil(maxVal / 5) * 5 : Math.ceil(maxVal / 10) * 10;

    const totalW = responsiveWidth(container);
    const isNarrow = totalW < 420;
    const margin = { top: 32, right: isNarrow ? 28 : 56, bottom: 36, left: isNarrow ? 28 : 56 };
    const width = totalW - margin.left - margin.right;
    const centerX = width / 2;
    const labelColW = isNarrow ? 56 : 90;
    const barAreaW = (width - labelColW) / 2;
    const height = data.length * rowHeight + margin.top + margin.bottom;

    const xLeft = d3.scaleLinear().domain([0, domainMax]).range([0, barAreaW]);
    const xRight = d3.scaleLinear().domain([0, domainMax]).range([0, barAreaW]);

    const y = d3
      .scaleBand()
      .domain(data.map(function (d) { return d.category; }))
      .range([0, data.length * rowHeight])
      .padding(0.35);

    d3.select(container).select('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${totalW} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Center axis
    g.append('line')
      .attr('x1', centerX)
      .attr('x2', centerX)
      .attr('y1', -8)
      .attr('y2', data.length * rowHeight + 4)
      .attr('stroke', palette.border)
      .attr('stroke-width', 1);

    // Column headers
    g.append('text')
      .attr('x', centerX - labelColW / 2 - barAreaW / 2)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .style('font-family', "'Source Sans 3', sans-serif")
      .style('font-size', isNarrow ? '10px' : '12px')
      .style('font-weight', '700')
      .style('fill', leftColor)
      .text(leftLabel);

    g.append('text')
      .attr('x', centerX + labelColW / 2 + barAreaW / 2)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .style('font-family', "'Source Sans 3', sans-serif")
      .style('font-size', isNarrow ? '10px' : '12px')
      .style('font-weight', '700')
      .style('fill', rightColor)
      .text(rightLabel);

    const tip = createTooltip(container);

    const barH = y.bandwidth();

    // Left bars (grow leftward from center)
    var leftBars = g
      .selectAll('.bf-left')
      .data(data)
      .enter()
      .append('rect')
      .attr('y', function (d) { return y(d.category); })
      .attr('height', barH)
      .attr('rx', 3)
      .attr('fill', leftColor)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.8);
        var rect = container.getBoundingClientRect();
        tip.show('<strong>' + leftLabel + '</strong><br>' + d.category + ': ' + valueLabel(d.left), event.clientX - rect.left, event.clientY - rect.top - 44);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        tip.hide();
      });

    // Right bars (grow rightward from center)
    var rightBars = g
      .selectAll('.bf-right')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', centerX + labelColW / 2)
      .attr('y', function (d) { return y(d.category); })
      .attr('height', barH)
      .attr('rx', 3)
      .attr('fill', rightColor)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.8);
        var rect = container.getBoundingClientRect();
        tip.show('<strong>' + rightLabel + '</strong><br>' + d.category + ': ' + valueLabel(d.right), event.clientX - rect.left, event.clientY - rect.top - 44);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        tip.hide();
      });

    if (animate) {
      leftBars
        .attr('x', centerX - labelColW / 2)
        .attr('width', 0)
        .transition()
        .duration(700)
        .delay(function (d, i) { return i * 80; })
        .ease(d3.easeCubicOut)
        .attr('x', function (d) { return centerX - labelColW / 2 - xLeft(d.left); })
        .attr('width', function (d) { return xLeft(d.left); });

      rightBars
        .attr('width', 0)
        .transition()
        .duration(700)
        .delay(function (d, i) { return i * 80; })
        .ease(d3.easeCubicOut)
        .attr('width', function (d) { return xRight(d.right); });
    } else {
      leftBars
        .attr('x', function (d) { return centerX - labelColW / 2 - xLeft(d.left); })
        .attr('width', function (d) { return xLeft(d.left); });
      rightBars.attr('width', function (d) { return xRight(d.right); });
    }

    // Left value labels
    var bfValFontSize = isNarrow ? '9px' : '11px';
    g.selectAll('.bf-lval')
      .data(data)
      .enter()
      .append('text')
      .attr('x', function (d) { return centerX - labelColW / 2 - xLeft(d.left) - (isNarrow ? 4 : 8); })
      .attr('y', function (d) { return y(d.category) + barH / 2; })
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', bfValFontSize)
      .style('font-weight', '500')
      .style('fill', leftColor)
      .text(function (d) { return valueLabel(d.left); })
      .attr('opacity', animate ? 0 : 1)
      .transition()
      .duration(animate ? 400 : 0)
      .delay(function (d, i) { return animate ? i * 80 + 400 : 0; })
      .attr('opacity', 1);

    // Right value labels
    g.selectAll('.bf-rval')
      .data(data)
      .enter()
      .append('text')
      .attr('x', function (d) { return centerX + labelColW / 2 + xRight(d.right) + (isNarrow ? 4 : 8); })
      .attr('y', function (d) { return y(d.category) + barH / 2; })
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', bfValFontSize)
      .style('font-weight', '500')
      .style('fill', rightColor)
      .text(function (d) { return valueLabel(d.right); })
      .attr('opacity', animate ? 0 : 1)
      .transition()
      .duration(animate ? 400 : 0)
      .delay(function (d, i) { return animate ? i * 80 + 400 : 0; })
      .attr('opacity', 1);

    // Category labels (center)
    g.selectAll('.bf-cat')
      .data(data)
      .enter()
      .append('text')
      .attr('x', centerX)
      .attr('y', function (d) { return y(d.category) + barH / 2; })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'Source Sans 3', sans-serif")
      .style('font-size', isNarrow ? '9px' : '11px')
      .style('font-weight', '600')
      .style('fill', palette.textPrimary)
      .text(function (d) { return d.category; });
  }

  /* --- Observe and render on scroll into view --- */
  function renderOnVisible(containerSelector, renderFn) {
    const el = document.querySelector(containerSelector);
    if (!el) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              renderFn();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(el);
    } else {
      renderFn();
    }
  }

  return { barChart, groupedBarChart, lollipopChart, dumbbellChart, waffleChart, iconArray, slopeChart, butterflyChart, createTooltip, renderOnVisible };
})();
