/**
 * @module Graph/renderer
 * @description
 * Offers a series of methods that isolate render logic for Graph component.
 */
import React from 'react';

import CONST from './graph.const';
import { MARKERS, MARKER_SMALL_SIZE, MARKER_MEDIUM_OFFSET, MARKER_LARGE_OFFSET } from '../marker/marker.const';

import Link from '../link/Link';
import Node from '../node/Node';
import Marker from '../marker/Marker';
import { buildLinkProps, buildNodeProps } from './graph.helper';
import { isNodeVisible } from './collapse.helper';

/**
 * Build Link components given a list of links.
 * @param  {Object.<string, Object>} nodes - same as {@link #buildGraph|nodes in buildGraph}.
 * @param  {Array.<Object>} links - array of links {@link #Link|Link}.
 * @param  {Array.<Object>} linksMatrix - array of links {@link #Link|Link}.
 * @param  {Object} config - same as {@link #buildGraph|config in buildGraph}.
 * @param  {Function[]} linkCallbacks - same as {@link #buildGraph|linkCallbacks in buildGraph}.
 * @param  {string} highlightedNode - same as {@link #buildGraph|highlightedNode in buildGraph}.
 * @param  {Object} highlightedLink - same as {@link #buildGraph|highlightedLink in buildGraph}.
 * @param  {number} transform - value that indicates the amount of zoom transformation.
 * @returns {Array.<Object>} returns the generated array of Link components.
 * @memberof Graph/helper
 */
function _buildLinks(nodes, links, linksMatrix, config, linkCallbacks, highlightedNode, highlightedLink, transform) {
    let outLinks = links;

    if (config.collapsible) {
        outLinks = outLinks.filter(({ isHidden }) => !isHidden);
    }

    return outLinks.map(link => {
        const { source, target } = link;
        // FIXME: solve this source data inconsistency later
        const sourceId = source.id || source;
        const targetId = target.id || target;
        const key = `${sourceId}${CONST.COORDS_SEPARATOR}${targetId}`;
        const props = buildLinkProps(
            { ...link, source: `${sourceId}`, target: `${targetId}` },
            nodes,
            linksMatrix,
            config,
            linkCallbacks,
            `${highlightedNode}`,
            highlightedLink,
            transform
        );

        return <Link key={key} {...props} />;
    });
}

/**
 * Function that builds Node components.
 * @param  {Object.<string, Object>} nodes - an object containing all nodes mapped by their id.
 * @param  {Function[]} nodeCallbacks - array of callbacks for used defined event handler for node interactions.
 * @param  {Object} config - an object containing rd3g consumer defined configurations {@link #config config} for the graph.
 * @param  {string} highlightedNode - this value contains a string that represents the some currently highlighted node.
 * @param  {Object} highlightedLink - this object contains a source and target property for a link that is highlighted at some point in time.
 * @param  {string} highlightedLink.source - id of source node for highlighted link.
 * @param  {string} highlightedLink.target - id of target node for highlighted link.
 * @param  {number} transform - value that indicates the amount of zoom transformation.
 * @param  {Object.<string, Object>} linksMatrix - the matrix of connections of the graph
 * @returns {Array.<Object>} returns the generated array of nodes components
 * @memberof Graph/helper
 */
function _buildNodes(nodes, nodeCallbacks, config, highlightedNode, highlightedLink, transform, linksMatrix) {
    let outNodes = Object.keys(nodes);

    if (config.collapsible) {
        outNodes = outNodes.filter(nodeId => isNodeVisible(nodeId, linksMatrix));
    }

    return outNodes.map(nodeId => {
        const props = buildNodeProps(
            Object.assign({}, nodes[nodeId], { id: `${nodeId}` }),
            config,
            nodeCallbacks,
            highlightedNode,
            highlightedLink,
            transform
        );

        return <Node key={nodeId} {...props} />;
    });
}

/**
 * Builds graph defs (for now markers, but we could also have gradients for instance).
 * NOTE: defs are static svg graphical objects, thus we only need to render them once, the result
 * is cached on the 1st call and from there we simply return the cached jsx.
 * @returns {Object} graph reusable objects [defs](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs).
 * @memberof Graph/helper
 */
function _buildDefs() {
    let cachedDefs;

    return config => {
        if (cachedDefs) {
            return cachedDefs;
        }

        const small = MARKER_SMALL_SIZE;
        const medium = small + MARKER_MEDIUM_OFFSET * config.maxZoom / 3;
        const large = small + MARKER_LARGE_OFFSET * config.maxZoom / 3;

        cachedDefs = (
            <defs>
                <Marker id={MARKERS.MARKER_S} refX={small} fill={config.link.color} />
                <Marker id={MARKERS.MARKER_SH} refX={small} fill={config.link.highlightColor} />
                <Marker id={MARKERS.MARKER_M} refX={medium} fill={config.link.color} />
                <Marker id={MARKERS.MARKER_MH} refX={medium} fill={config.link.highlightColor} />
                <Marker id={MARKERS.MARKER_L} refX={large} fill={config.link.color} />
                <Marker id={MARKERS.MARKER_LH} refX={large} fill={config.link.highlightColor} />
            </defs>
        );

        return cachedDefs;
    };
}

// memoized reference for _buildDefs
const _memoizedBuildDefs = _buildDefs();

/**
 * Method that actually is exported an consumed by Graph component in order to build all Nodes and Link
 * components.
 * @param  {Object.<string, Object>} nodes - an object containing all nodes mapped by their id.
 * @param  {Function[]} nodeCallbacks - array of callbacks for used defined event handler for node interactions.
 * @param  {Array.<Object>} links - array of links {@link #Link|Link}.
 * @param  {Object.<string, Object>} linksMatrix - an object containing a matrix of connections of the graph, for each nodeId,
 * there is an Object that maps adjacent nodes ids (string) and their values (number).
 * ```javascript
 *  // links example
 *  {
 *     "Androsynth": {
 *         "Chenjesu": 1,
 *         "Ilwrath": 1,
 *         "Mycon": 1,
 *         "Spathi": 1,
 *         "Umgah": 1,
 *         "VUX": 1,
 *         "Guardian": 1
 *     },
 *     "Chenjesu": {
 *         "Androsynth": 1,
 *         "Mycon": 1,
 *         "Spathi": 1,
 *         "Umgah": 1,
 *         "VUX": 1,
 *         "Broodhmome": 1
 *     },
 *     ...
 *  }
 * ```
 * @param  {Function[]} linkCallbacks - array of callbacks for used defined event handler for link interactions.
 * @param  {Object} config - an object containing rd3g consumer defined configurations {@link #config config} for the graph.
 * @param  {string} highlightedNode - this value contains a string that represents the some currently highlighted node.
 * @param  {Object} highlightedLink - this object contains a source and target property for a link that is highlighted at some point in time.
 * @param  {string} highlightedLink.source - id of source node for highlighted link.
 * @param  {string} highlightedLink.target - id of target node for highlighted link.
 * @param  {number} transform - value that indicates the amount of zoom transformation.
 * @returns {Object} returns an object containing the generated nodes and links that form the graph.
 * @memberof Graph/renderer
 */
function buildGraph(
    nodes,
    nodeCallbacks,
    links,
    linksMatrix,
    linkCallbacks,
    config,
    highlightedNode,
    highlightedLink,
    transform
) {
    return {
        nodes: _buildNodes(nodes, nodeCallbacks, config, highlightedNode, highlightedLink, transform, linksMatrix),
        links: _buildLinks(
            nodes,
            links,
            linksMatrix,
            config,
            linkCallbacks,
            highlightedNode,
            highlightedLink,
            transform
        ),
        defs: _memoizedBuildDefs(config)
    };
}

export { buildGraph };
