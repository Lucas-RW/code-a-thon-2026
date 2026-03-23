// graph.js
(function () {
    const COLORS = {
        skill: "#60a5fa",       // Vibrant Blue
        building: "#34d399",    // Emerald Green
        opportunity: "#fbbf24", // Golden Amber
        me: "#f472b6",          // Pink Prism
        default: "#94a3b8"
    };

    const REVEAL_DELAY_MS = 500;   // gap between each node lighting up
    const REVEAL_FADE_MS  = 600;   // duration of each fade-in transition
    const SETTLE_MS       = 800;   // let the physics settle before revealing

    let networkSimulation;
    let isAnimating = false;       // block clicks/drags during the reveal
    let pendingTimers = [];        // track all reveal setTimeout IDs

    function cancelPendingReveal() {
        pendingTimers.forEach(id => clearTimeout(id));
        pendingTimers = [];
        isAnimating = false;
    }

    function initGraph(svgId, data, skipReveal) {
        cancelPendingReveal();     // cancel any in-flight animation from a previous path
        const svg = d3.select(svgId);
        svg.selectAll("*").remove(); 
        
        const rect = svg.node().getBoundingClientRect();
        const width = rect.width || 400;
        const height = rect.height || 450;

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.id).distance(110).strength(l => {
                if (l.isSpine || l.isSecondary) return 1;
                return 0;
            }))
            .force("charge", d3.forceManyBody().strength(-600))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(60));

        const defs = svg.append("defs");

        // Standard glow filter
        const filter = defs.append("filter")
            .attr("id", "glow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");
        
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "3.5")
            .attr("result", "blur");
        
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "blur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Intense glow for the gold node reveal burst
        const burstFilter = defs.append("filter")
            .attr("id", "glow-burst")
            .attr("x", "-100%")
            .attr("y", "-100%")
            .attr("width", "300%")
            .attr("height", "300%");
        
        burstFilter.append("feGaussianBlur")
            .attr("stdDeviation", "8")
            .attr("result", "blur");
        
        const burstMerge = burstFilter.append("feMerge");
        burstMerge.append("feMergeNode").attr("in", "blur");
        burstMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // ── Links ──
        const link = svg.append("g")
            .selectAll("line")
            .data(data.links)
            .enter().append("line")
            .attr("class", d => d.isSecondary ? "secondary-line" : "power-line")
            .style("stroke", "#1e293b")
            .style("stroke-opacity", 0)
            .style("stroke-width", 1)
            .style("stroke-dasharray", d => d.isSecondary ? "4,4" : "none");

        // ── Node groups ──
        const nodeGroup = svg.append("g")
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g")
            .style("opacity", 0)                       // start fully hidden
            .style("pointer-events", "none")            // no interaction during reveal
            .on("click", (event, d) => {
                if (isAnimating) return;
                event.stopPropagation();
                toggleNode(d);
                showMiniCard(d);
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        const outerCircle = nodeGroup.append("circle")
            .attr("class", "glow-circle")
            .attr("r", d => d.type === 'me' ? 22 : (d.type === 'gold' ? 28 : 18))
            .attr("fill", d => d.type === 'me' ? COLORS.me : (d.type === 'gold' ? '#fde047' : (COLORS[d.type] || COLORS.default)))
            .style("filter", "url(#glow)")
            .style("opacity", 0.5);

        const innerCircle = nodeGroup.append("circle")
            .attr("class", "node-circle")
            .attr("r", d => d.type === 'me' ? 16 : (d.type === 'gold' ? 20 : 14))
            .attr("fill", d => d.type === 'me' ? COLORS.me : (d.type === 'gold' ? '#fbbf24' : (COLORS[d.type] || COLORS.default)))
            .style("stroke", "#fff")
            .style("stroke-width", 2)
            .style("opacity", 1);

        nodeGroup.append("text")
            .attr("dy", 40)
            .style("font-size", "13px")
            .style("font-weight", "900")
            .style("fill", "#fff")
            .style("opacity", 1)
            .style("text-anchor", "middle")
            .style("text-shadow", "0 2px 5px rgba(0,0,0,0.9)")
            .text(d => d.label);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeGroup
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        function toggleNode(d) {
            if (isAnimating) return;
            if (d.type === 'me' || d.type === 'building') return;
            d.selected = !d.selected;
            updateVisuals();
            
            const msg = JSON.stringify({ type: 'TOGGLE_NODE', nodeId: d.id, selected: d.selected });
            if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
            else window.parent.postMessage(msg, "*");
        }

        function updateVisuals() {
            // Sync buildings selection with their target opportunities
            data.links.forEach(l => {
                if (l.isSecondary) {
                    const b = l.source;
                    const o = l.target;
                    if (b.type === 'building' && o.type !== 'building') {
                        b.selected = o.selected;
                    }
                }
            });

            nodeGroup.selectAll(".glow-circle").style("opacity", d => d.selected ? 0.5 : 0.1);
            nodeGroup.selectAll(".node-circle").style("opacity", d => d.selected ? 1 : 0.3);
            nodeGroup.selectAll("text").style("opacity", d => d.selected ? 1 : 0.4);
            
            // 1. Hide all lines first
            svg.selectAll(".power-line")
                .style("stroke", "#1e293b")
                .style("stroke-opacity", 0.1)
                .style("stroke-width", 1);
            svg.selectAll(".secondary-line")
                .style("stroke", "#1e293b")
                .style("stroke-opacity", 0.1)
                .style("stroke-width", 1);

            // 2. Identify selected path nodes
            const selectedNodes = data.nodes
                .filter(n => n.selected && (n.type === 'me' || n.type === 'opportunity' || n.type === 'gold' || n.isAlt))
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 3. Highlight the spine
            for (let i = 0; i < selectedNodes.length - 1; i++) {
                const sId = selectedNodes[i].id;
                const tId = selectedNodes[i+1].id;
                
                svg.selectAll(".power-line")
                    .filter(l => (l.source.id === sId && l.target.id === tId) || (l.source.id === tId && l.target.id === sId))
                    .style("stroke", "#fbbf24")
                    .style("stroke-opacity", 0.9)
                    .style("stroke-width", 4)
                    .style("filter", "url(#glow)");
            }
            
            // 4. Highlight Building links if both are selected
            svg.selectAll(".secondary-line")
                .filter(l => l.source.selected && l.target.selected)
                .style("stroke", "#34d399")
                .style("stroke-opacity", 0.6)
                .style("stroke-width", 2);
        }

        function showMiniCard(d) {
            const card = document.getElementById("mini-card");
            const title = document.getElementById("mini-title");
            const desc = document.getElementById("mini-desc");
            const type = document.getElementById("mini-type");
            const status = document.getElementById("mini-status");

            card.style.display = "block";
            title.innerText = d.label;
            type.innerText = d.type;
            desc.innerText = d.desc || (d.isAlt ? "Strategy: Recommended path to bolster technical depth before attempting this milestone." : "Core opportunity recommended for your specialized career trajectory.");
            
            status.innerText = d.selected ? "Selected" : "Deselected";
            status.className = d.selected ? "status-btn" : "status-btn deselected";
            
            status.onclick = (e) => {
                e.stopPropagation();
                toggleNode(d);
                showMiniCard(d);
            };
        }

        svg.on("click", () => {
            document.getElementById("mini-card").style.display = "none";
        });

        function dragstarted(event) {
            if (isAnimating) return;
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event) {
            if (isAnimating) return;
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event) {
            if (isAnimating) return;
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // ── Reveal animation ──
        if (!skipReveal) {
            revealPathSequentially(data, svg, nodeGroup, link, simulation, updateVisuals);
        } else {
            // No animation — show everything immediately
            nodeGroup.style("opacity", 1).style("pointer-events", "all");
            link.style("stroke-opacity", d => (d.source.selected && d.target.selected) ? 0.8 : 0.1);
            updateVisuals();
        }

        return simulation;
    }

    // ────────────────────────────────────────────────────────
    //  Sequential path reveal animation
    // ────────────────────────────────────────────────────────
    function revealPathSequentially(data, svg, nodeGroup, link, simulation, updateVisuals) {
        isAnimating = true;

        // Build the ordered reveal sequence: ME → opp1 → opp2 → … → gold
        const spineNodes = data.nodes
            .filter(n => n.selected && (n.type === 'me' || n.type === 'opportunity' || n.type === 'gold'))
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Map each opp node to its associated building + secondary link
        const oppToBuildingMap = {};
        data.links.forEach(l => {
            if (l.isSecondary) {
                const src = typeof l.source === 'object' ? l.source : data.nodes.find(n => n.id === l.source);
                const tgt = typeof l.target === 'object' ? l.target : data.nodes.find(n => n.id === l.target);
                if (src && tgt) {
                    if (src.type === 'building') oppToBuildingMap[tgt.id] = src.id;
                    else if (tgt.type === 'building') oppToBuildingMap[src.id] = tgt.id;
                }
            }
        });

        // Let physics settle before we start revealing
        pendingTimers.push(setTimeout(() => {
            simulation.alphaTarget(0); // cool down
            
            spineNodes.forEach((node, index) => {
                pendingTimers.push(setTimeout(() => {
                    // ── Reveal this spine node ──
                    revealNode(nodeGroup, node, node.type === 'gold');

                    // ── Reveal the link connecting to the previous node ──
                    if (index > 0) {
                        const prevId = spineNodes[index - 1].id;
                        revealLinkBetween(link, prevId, node.id);
                    }

                    // ── Reveal associated building node + secondary link ──
                    const buildingId = oppToBuildingMap[node.id];
                    if (buildingId) {
                        const buildingNode = data.nodes.find(n => n.id === buildingId);
                        if (buildingNode) {
                            pendingTimers.push(setTimeout(() => {
                                revealNode(nodeGroup, buildingNode, false);
                                revealSecondaryLink(link, buildingId, node.id);
                            }, REVEAL_FADE_MS * 0.3));
                        }
                    }

                    // ── After the last node: reveal alt nodes, unlock interactions ──
                    if (index === spineNodes.length - 1) {
                        pendingTimers.push(setTimeout(() => {
                            // Reveal any alt nodes that weren't on the spine
                            const altNodes = data.nodes.filter(n => n.isAlt);
                            altNodes.forEach((alt, ai) => {
                                pendingTimers.push(setTimeout(() => {
                                    revealNode(nodeGroup, alt, false);
                                    // Reveal building link for alt too
                                    const altBldg = oppToBuildingMap[alt.id];
                                    if (altBldg) {
                                        const bNode = data.nodes.find(n => n.id === altBldg);
                                        if (bNode) revealNode(nodeGroup, bNode, false);
                                        revealSecondaryLink(link, altBldg, alt.id);
                                    }
                                }, ai * 200));
                            });

                            // Unlock
                            pendingTimers.push(setTimeout(() => {
                                isAnimating = false;
                                nodeGroup.style("pointer-events", "all");
                                updateVisuals();
                            }, altNodes.length * 200 + 300));
                        }, REVEAL_FADE_MS));
                    }

                }, index * REVEAL_DELAY_MS));
            });

        }, SETTLE_MS));
    }

    function revealNode(nodeGroup, nodeData, isGold) {
        const sel = nodeGroup.filter(d => d.id === nodeData.id);

        // Fade the whole group in
        sel.transition()
            .duration(REVEAL_FADE_MS)
            .style("opacity", 1);

        // Pulse: scale up then back down
        const circles = sel.selectAll("circle");
        circles
            .transition()
            .duration(REVEAL_FADE_MS * 0.4)
            .attr("r", function () {
                return +d3.select(this).attr("r") * 1.5;
            })
            .transition()
            .duration(REVEAL_FADE_MS * 0.6)
            .attr("r", function () {
                return +d3.select(this).attr("r") / 1.5;
            });

        // Gold node gets extra glow burst
        if (isGold) {
            sel.selectAll(".glow-circle")
                .style("filter", "url(#glow-burst)")
                .transition()
                .duration(1200)
                .style("opacity", 0.8)
                .transition()
                .duration(800)
                .style("opacity", 0.5)
                .style("filter", "url(#glow)");
        }
    }

    function revealLinkBetween(linkSel, sourceId, targetId) {
        linkSel
            .filter(l => {
                const sId = typeof l.source === 'object' ? l.source.id : l.source;
                const tId = typeof l.target === 'object' ? l.target.id : l.target;
                return ((sId === sourceId && tId === targetId) || (sId === targetId && tId === sourceId))
                    && (l.isSpine || l.isJump);
            })
            .transition()
            .duration(REVEAL_FADE_MS)
            .style("stroke", "#fbbf24")
            .style("stroke-opacity", 0.9)
            .style("stroke-width", 4)
            .style("filter", "url(#glow)");
    }

    function revealSecondaryLink(linkSel, buildingId, oppId) {
        linkSel
            .filter(l => {
                const sId = typeof l.source === 'object' ? l.source.id : l.source;
                const tId = typeof l.target === 'object' ? l.target.id : l.target;
                return l.isSecondary && ((sId === buildingId && tId === oppId) || (sId === oppId && tId === buildingId));
            })
            .transition()
            .duration(REVEAL_FADE_MS)
            .style("stroke", "#34d399")
            .style("stroke-opacity", 0.6)
            .style("stroke-width", 2);
    }

    // ────────────────────────────────────────────────────────
    //  Data → Graph pipeline
    // ────────────────────────────────────────────────────────
    function populateFromPath(path, alternatives = []) {
        const networkNodes = [];
        const networkLinks = [];
        const nodeSet = new Set();

        const meId = "me:current_user";
        networkNodes.push({ 
            id: meId, 
            label: 'ME', 
            type: 'me', 
            order: 0,
            desc: "Starting Point. This represents your current skills and baseline profile.", 
            selected: true 
        });
        nodeSet.add(meId);

        // 1. Add all potential Opp/Alt nodes
        const allOpps = [
            ...path.map((s, i) => ({ ...s, isMain: true, nodeOrder: i + 1 })),
            ...alternatives.map((a, i) => ({ ...a, isAlt: true, nodeOrder: (a.order || 1) + 0.5 }))
        ];

        // 2. Process Buildings (Secondary)
        allOpps.forEach((opp, index) => {
            const bId = `bldg:${opp.building_id || 'unkn_' + index}`;
            if (!nodeSet.has(bId)) {
                networkNodes.push({ 
                    id: bId, 
                    label: opp.building_name || "UF Campus", 
                    type: 'building', 
                    selected: true 
                });
                nodeSet.add(bId);
            }
        });

        // 3. Process Opportunities
        allOpps.forEach((opp) => {
            const oId = (opp.isAlt ? "alt:" : "opp:") + (opp.opportunity_id || opp.opportunity_title);
            if (!nodeSet.has(oId)) {
                networkNodes.push({ 
                    id: oId, 
                    label: opp.opportunity_title, 
                    type: opp.isMain && opp.nodeOrder === path.length ? 'gold' : 'opportunity', 
                    desc: opp.short_reason || opp.description,
                    order: opp.nodeOrder,
                    isAlt: !!opp.isAlt,
                    selected: !!opp.isMain
                });
                nodeSet.add(oId);

                // Link to its building
                const bId = `bldg:${opp.building_id || 'unkn_' + allOpps.indexOf(opp)}`;
                networkLinks.push({ source: bId, target: oId, isSecondary: true });
            }
        });

        // 4. Master sequence
        const masterSequence = networkNodes
            .filter(n => n.type === 'me' || n.type === 'opportunity' || n.type === 'gold' || n.isAlt)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // 5. Connect each node to all subsequent nodes
        for (let i = 0; i < masterSequence.length; i++) {
            for (let j = i + 1; j < masterSequence.length; j++) {
                networkLinks.push({ 
                    source: masterSequence[i].id, 
                    target: masterSequence[j].id, 
                    isSpine: j === i + 1,
                    isJump: j > i + 1
                });
            }
        }

        // 6. Manual Initial Placement (Right to Left)
        const w = 400; const h = 450;
        const maxO = Math.max(...networkNodes.map(n => n.order || 0), 1);
        networkNodes.forEach(n => {
            n.x = w * (0.85 - (n.order || 0) / (maxO + 1) * 0.75);
            n.y = h / 2 + (Math.random() - 0.5) * 60;
        });

        networkSimulation = initGraph("#network-graph", { nodes: networkNodes, links: networkLinks }, false);
    }

    function populateDefaultGraph() {
        const defaultPath = [
            {
                opportunity_id: "starter_club",
                opportunity_title: "Join a Career Club",
                building_id: "student_union",
                building_name: "Student Union",
                short_reason: "Start by meeting peers, learning the campus ecosystem, and finding recurring events.",
                skills: ["Networking", "Communication"],
                order: 1
            },
            {
                opportunity_id: "starter_project",
                opportunity_title: "Build a Personal Project",
                building_id: "innovation_lab",
                building_name: "Innovation Lab",
                short_reason: "Create something tangible that shows initiative and gives you stories to share.",
                skills: ["Problem Solving", "Project Planning"],
                order: 2
            },
            {
                opportunity_id: "starter_internship",
                opportunity_title: "Apply for an Internship",
                building_id: "career_center",
                building_name: "Career Center",
                short_reason: "Use your project work and campus network to pursue a concrete next step.",
                skills: ["Interviewing", "Professional Growth"],
                order: 3
            }
        ];

        const defaultAlternatives = [
            {
                opportunity_id: "starter_research",
                opportunity_title: "Join a Research Group",
                building_id: "research_hall",
                building_name: "Research Hall",
                short_reason: "A strong alternate route if you want deeper technical mentorship and hands-on experience.",
                skills: ["Research", "Critical Thinking"],
                order: 2
            }
        ];

        populateFromPath(defaultPath, defaultAlternatives);
    }

    function handleMessage(event) {
        let payload;
        try {
            payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
            return;
        }

        if (payload.type === "UPDATE_DATA") {
            if (payload.path && payload.path.length > 0) {
                populateFromPath(payload.path, payload.alternatives);
            } else {
                populateDefaultGraph();
            }
        }
    }

    window.addEventListener("message", handleMessage);
    document.addEventListener("message", handleMessage);
    populateDefaultGraph();
})();
