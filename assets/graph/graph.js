// graph.js
(function () {
    const COLORS = {
        skill: "#3b82f6",
        building: "#10b981",
        opportunity: "#f59e0b",
        default: "#94a3b8"
    };

    const mockSkills = {
        nodes: [
            { id: "skill:python", label: "Python", type: "skill" },
            { id: "skill:sql", label: "SQL", type: "skill" },
            { id: "skill:ml", label: "Machine Learning", type: "skill" },
            { id: "skill:data_viz", label: "Data Viz", type: "skill" },
            { id: "skill:react", label: "React", type: "skill" },
            { id: "skill:typescript", label: "TypeScript", type: "skill" },
            { id: "skill:node", label: "Node.js", type: "skill" }
        ],
        links: [
            { source: "skill:python", target: "skill:ml" },
            { source: "skill:python", target: "skill:data_viz" },
            { source: "skill:sql", target: "skill:data_viz" },
            { source: "skill:react", target: "skill:typescript" },
            { source: "skill:typescript", target: "skill:node" }
        ]
    };

    const mockNetwork = {
        nodes: [
            { id: "bldg:reitz", label: "Reitz Union", type: "building" },
            { id: "bldg:marston", label: "Marston Library", type: "building" },
            { id: "bldg:cse", label: "CSE Building", type: "building" },
            { id: "opp:ai-club", label: "AI Club", type: "opportunity" },
            { id: "opp:hack-uf", label: "HackUF", type: "opportunity" },
            { id: "opp:research-lab", label: "Bio-ML Lab", type: "opportunity" }
        ],
        links: [
            { source: "bldg:reitz", target: "opp:ai-club" },
            { source: "bldg:marston", target: "opp:hack-uf" },
            { source: "bldg:cse", target: "opp:research-lab" },
            { source: "opp:ai-club", target: "opp:hack-uf" }
        ]
    };

    function initGraph(svgId, data) {
        const svg = d3.select(svgId);
        const width = svg.node().getBoundingClientRect().width;
        const height = svg.node().getBoundingClientRect().height;

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.id).distance(80))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(data.links)
            .enter().append("line")
            .attr("class", "link");

        const nodeGroup = svg.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        const node = nodeGroup.append("circle")
            .attr("class", "node")
            .attr("r", 8)
            .attr("fill", d => COLORS[d.type] || COLORS.default);

        const text = nodeGroup.append("text")
            .attr("dy", 18)
            .attr("class", "label")
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

        return { node, link, text, data };
    }

    const skillsGraph = initGraph("#skills-graph", mockSkills);
    const networkGraph = initGraph("#network-graph", mockNetwork);

    function highlightPath(payload) {
        const { skillNodeIds = [], networkNodeIds = [] } = payload;
        const skillSet = new Set(skillNodeIds);
        const networkSet = new Set(networkNodeIds);

        // Update Skills Graph
        skillsGraph.node.transition().duration(300)
            .style("opacity", d => skillSet.size === 0 || skillSet.has(d.id) ? 1 : 0.15)
            .attr("r", d => skillSet.has(d.id) ? 12 : 8)
            .style("stroke-width", d => skillSet.has(d.id) ? 3 : 1.5)
            .style("stroke", d => skillSet.has(d.id) ? "#fff" : "#0f172a");

        skillsGraph.text.transition().duration(300)
            .style("opacity", d => skillSet.size === 0 || skillSet.has(d.id) ? 1 : 0.15)
            .style("font-weight", d => skillSet.has(d.id) ? "bold" : "normal");

        skillsGraph.link.transition().duration(300)
            .style("opacity", d => {
                if (skillSet.size === 0) return 0.6;
                // If either end is in the set, highlight it
                return skillSet.has(d.source.id) && skillSet.has(d.target.id) ? 1 : 0.1;
            })
            .style("stroke-width", d => skillSet.has(d.source.id) && skillSet.has(d.target.id) ? 2 : 1);

        // Update Network Graph
        networkGraph.node.transition().duration(300)
            .style("opacity", d => networkSet.size === 0 || networkSet.has(d.id) ? 1 : 0.15)
            .attr("r", d => networkSet.has(d.id) ? 12 : 8)
            .style("stroke-width", d => networkSet.has(d.id) ? 3 : 1.5)
            .style("stroke", d => networkSet.has(d.id) ? "#fff" : "#0f172a");

        networkGraph.text.transition().duration(300)
            .style("opacity", d => networkSet.size === 0 || networkSet.has(d.id) ? 1 : 0.15)
            .style("font-weight", d => networkSet.has(d.id) ? "bold" : "normal");

        networkGraph.link.transition().duration(300)
            .style("opacity", d => {
                if (networkSet.size === 0) return 0.6;
                return networkSet.has(d.source.id) && networkSet.has(d.target.id) ? 1 : 0.1;
            })
            .style("stroke-width", d => networkSet.has(d.source.id) && networkSet.has(d.target.id) ? 2 : 1);
    }

    function clearHighlight() {
        highlightPath({ skillNodeIds: [], networkNodeIds: [] });
    }

    function handleMessage(event) {
        let payload;
        try {
            payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
            return;
        }

        if (payload.type === "HIGHLIGHT_PATH") {
            highlightPath(payload);
        } else if (payload.type === "CLEAR_HIGHLIGHT") {
            clearHighlight();
        }
    }

    // React Native WebView messaging listeners
    window.addEventListener("message", handleMessage);
    document.addEventListener("message", handleMessage); // For Android
})();
