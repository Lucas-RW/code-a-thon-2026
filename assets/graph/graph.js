// graph.js
(function () {
    const COLORS = {
        skill: "#60a5fa",       // Vibrant Blue
        building: "#34d399",    // Emerald Green
        opportunity: "#fbbf24", // Golden Amber
        me: "#f472b6",          // Pink Prism
        default: "#94a3b8"
    };

    let skillsSimulation, networkSimulation;

    function initGraph(svgId, data) {
        const svg = d3.select(svgId);
        svg.selectAll("*").remove(); 
        
        const rect = svg.node().getBoundingClientRect();
        const width = rect.width || 400;
        const height = rect.height || 450;

        // Selection state is handled in populateFromPath or explicitly via messages

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.id).distance(110).strength(l => {
                // IMPORTANT: Only give physical tension to the direct spine and buildings.
                // "Jump" links must have 0 strength so they don't pull the graph into a ball, 
                // but they MUST be in the simulation so D3 resolves their source/target references.
                if (l.isSpine || l.isSecondary) return 1;
                return 0;
            }))
            .force("charge", d3.forceManyBody().strength(-600))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(60));

        const defs = svg.append("defs");
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

        const link = svg.append("g")
            .selectAll("line")
            .data(data.links)
            .enter().append("line")
            .attr("class", d => d.isSecondary ? "secondary-line" : "power-line")
            .style("stroke", d => (d.source.selected && d.target.selected) ? (d.isSecondary ? "#34d399" : "#fbbf24") : "#1e293b")
            .style("stroke-opacity", d => (d.source.selected && d.target.selected) ? 0.8 : 0.1)
            .style("stroke-width", d => (d.source.selected && d.target.selected) ? (d.isSecondary ? 2 : 4) : 1)
            .style("stroke-dasharray", d => d.isSecondary ? "4,4" : "none")
            .style("transition", "all 0.3s ease");

        const nodeGroup = svg.append("g")
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g")
            .on("click", (event, d) => {
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
            .style("opacity", d => d.selected ? 0.5 : 0.1);

        const innerCircle = nodeGroup.append("circle")
            .attr("class", "node-circle")
            .attr("r", d => d.type === 'me' ? 16 : (d.type === 'gold' ? 20 : 14))
            .attr("fill", d => d.type === 'me' ? COLORS.me : (d.type === 'gold' ? '#fbbf24' : (COLORS[d.type] || COLORS.default)))
            .style("stroke", "#fff")
            .style("stroke-width", 2)
            .style("opacity", d => d.selected ? 1 : 0.3);

        nodeGroup.append("text")
            .attr("dy", 40)
            .style("font-size", "13px")
            .style("font-weight", "900")
            .style("fill", "#fff")
            .style("opacity", d => d.selected ? 1 : 0.4)
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
            if (d.type === 'me' || d.type === 'building') return;
            d.selected = !d.selected;
            updateVisuals();
            
            const msg = JSON.stringify({ type: 'TOGGLE_NODE', nodeId: d.id, selected: d.selected });
            if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
            else window.parent.postMessage(msg, "*");
        }

        function updateVisuals() {
            // First, sync buildings selection with their target opportunities
            data.links.forEach(l => {
                if (l.isSecondary) {
                    // building -> opportunity link
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

            // 2. Identify all selected path nodes (ME + Opportunities/Gold + Alts)
            // We sort them by their internal sequence 'order' or hierarchy
            const selectedNodes = data.nodes
                .filter(n => n.selected && (n.type === 'me' || n.type === 'opportunity' || n.type === 'gold' || n.isAlt))
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 3. Highlight the spine: Link consecutive selected nodes
            for (let i = 0; i < selectedNodes.length - 1; i++) {
                const sId = selectedNodes[i].id;
                const tId = selectedNodes[i+1].id;
                
                // Highlight any simulation link that connects these two
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
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return simulation;
    }

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

        // 1. Add all potential Opp/Alt nodes to ensure we have every possible jump target
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
                    selected: !!opp.isMain // Only main milestones selected by default
                });
                nodeSet.add(oId);

                // Link to its building
                const bId = `bldg:${opp.building_id || 'unkn_' + allOpps.indexOf(opp)}`;
                networkLinks.push({ source: bId, target: oId, isSecondary: true });
            }
        });

        // 4. MASTER Sequence: Get all potential path/alt nodes in order
        const masterSequence = networkNodes
            .filter(n => n.type === 'me' || n.type === 'opportunity' || n.type === 'gold' || n.isAlt)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // 5. Connect each node to ALL subsequent nodes in the sequence
        // We mark them as "Jump" links so they don't affect physics, only highlighting
        for (let i = 0; i < masterSequence.length; i++) {
            for (let j = i + 1; j < masterSequence.length; j++) {
                networkLinks.push({ 
                    source: masterSequence[i].id, 
                    target: masterSequence[j].id, 
                    isSpine: j === i + 1, // Direct backbone (for physics)
                    isJump: j > i + 1     // Multi-step skip (for highlighting)
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

        networkSimulation = initGraph("#network-graph", { nodes: networkNodes, links: networkLinks });
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
