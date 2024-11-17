// Import ArcGIS Core Components
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Basemap from '@arcgis/core/Basemap';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';

// Import Tool Components
import { DrawTools } from './drawTools.js';
import { LayerPanel } from './layerPanel.js';
import { SearchPanel } from './searchPanel.js';
import { ServicePanel } from './servicePanel.js';
import { BasemapGalleryPanel } from './basemapGallery.js';
import { PrintPanel } from './printPanel.js';
import { ExcelImport } from './excelImport.js';

export class App {
    constructor() {
        // Core properties
        this.map = null;
        this.view = null;
        this.tools = {};
        
        // Layers
        this.graphicsLayer = null;
        
        // State management
        this.activeToolType = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            await this.initializeMap();
            await this.initializeTools();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            this.handleError(error);
            throw error;
        }
    }

    async initializeMap() {
        // Create main graphics layer
        this.graphicsLayer = new GraphicsLayer({
            title: "Graphics Layer"
        });

        // Initialize map with default basemap
        this.map = new Map({
            basemap: "topo-vector",
            layers: [this.graphicsLayer]
        });

        // Initialize map view
        this.view = new MapView({
            container: "viewDiv",
            map: this.map,
            center: [100.523186, 13.736717], // Bangkok coordinates
            zoom: 6,
            constraints: {
                rotationEnabled: false
            }
        });

        // Wait for view to be ready
        await this.view.when();
    }

    async initializeTools() {
        try {
            // Create tool instances
            this.tools = {
                draw: new DrawTools(this.map, this.view),
                layers: new LayerPanel(this.view),
                search: new SearchPanel(this.view),
                service: new ServicePanel(this.map),
                basemap: new BasemapGalleryPanel(this.view),
                print: new PrintPanel(this.view),
                excel: new ExcelImport(this.map, this.view)
            };

            // Initialize each tool
            for (const [name, tool] of Object.entries(this.tools)) {
                await tool.initialize();
                console.log(`${name} tool initialized successfully`);
            }
        } catch (error) {
            console.error('Error initializing tools:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Set up toolbar button handlers
        this.setupToolbarHandlers();

        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Set up view event handlers
        this.setupViewHandlers();

        // Window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    setupToolbarHandlers() {
        const toolbar = document.querySelector('.top-toolbar');
        
        toolbar.querySelectorAll('button[data-tool]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleToolbarClick(e);
            });
        });

        // Home button handler
        document.querySelector('.home-button').addEventListener('click', (e) => {
            e.preventDefault();
            this.resetView();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes active panel
            if (e.key === 'Escape') {
                this.closeActivePanel();
            }

            // Ctrl + specific keys for tools
            if (e.ctrlKey) {
                switch (e.key) {
                    case 'd': // Draw
                        this.activateTool('draw');
                        break;
                    case 'l': // Layers
                        this.activateTool('layers');
                        break;
                    case 'f': // Search (find)
                        this.activateTool('search');
                        break;
                    case 'p': // Print
                        this.activateTool('print');
                        break;
                }
                e.preventDefault();
            }
        });
    }

    setupViewHandlers() {
        // Handle view clicking
        this.view.on('click', (event) => {
            if (this.activeToolType === 'draw') {
                this.tools.draw.handleClick(event);
            }
        });

        // Handle view changes
        this.view.watch('extent', () => {
            this.updateScaleInfo();
        });
    }

    handleToolbarClick(event) {
        const toolType = event.target.dataset.tool;
        
        if (this.tools[toolType]) {
            this.activateTool(toolType);
        }
    }

    activateTool(toolType) {
        // Deactivate previous tool if exists
        if (this.activeToolType && this.activeToolType !== toolType) {
            this.tools[this.activeToolType].deactivate();
        }

        // Activate new tool
        if (this.tools[toolType]) {
            this.tools[toolType].activate();
            this.activeToolType = toolType;
            this.updateToolbarButtonStates(toolType);
        }
    }

    updateToolbarButtonStates(activeToolType) {
        document.querySelectorAll('.top-toolbar button').forEach(button => {
            const isActive = button.dataset.tool === activeToolType;
            button.classList.toggle('active', isActive);
        });
    }

    closeActivePanel() {
        if (this.activeToolType && this.tools[this.activeToolType]) {
            this.tools[this.activeToolType].deactivate();
            this.activeToolType = null;
            this.updateToolbarButtonStates(null);
        }
    }

    resetView() {
        this.view.goTo({
            center: [100.523186, 13.736717],
            zoom: 6
        });
    }

    updateScaleInfo() {
        const scale = Math.round(this.view.scale);
        // Update scale display if you have one
        // document.getElementById('scaleInfo').textContent = `1:${scale}`;
    }

    handleResize() {
        // Update view dimensions
        this.view.container.style.height = `${window.innerHeight}px`;
        this.view.container.style.width = `${window.innerWidth}px`;
    }

    handleError(error) {
        // Log error
        console.error('Application error:', error);

        // Show user-friendly error message
        alert('An error occurred. Please try refreshing the page.');

        // You might want to implement more sophisticated error handling here
    }

    getState() {
        return {
            center: this.view.center,
            zoom: this.view.zoom,
            basemap: this.map.basemap.id,
            activeToolType: this.activeToolType,
            layers: this.map.layers.toArray().map(layer => ({
                id: layer.id,
                title: layer.title,
                visible: layer.visible
            }))
        };
    }

    setState(state) {
        if (state.center && state.zoom) {
            this.view.goTo({
                center: state.center,
                zoom: state.zoom
            });
        }

        if (state.basemap) {
            this.map.basemap = Basemap.fromId(state.basemap);
        }

        if (state.activeToolType) {
            this.activateTool(state.activeToolType);
        }
    }

    async destroy() {
        try {
            // Remove event listeners
            window.removeEventListener('resize', this.handleResize);
            
            // Destroy tools
            for (const [name, tool] of Object.entries(this.tools)) {
                if (tool.destroy && typeof tool.destroy === 'function') {
                    await tool.destroy();
                    console.log(`${name} tool destroyed successfully`);
                }
            }

            // Clear tools object
            this.tools = {};

            // Destroy view and map
            if (this.view) {
                this.view.container.innerHTML = '';
                await this.view.destroy();
            }

            // Reset properties
            this.map = null;
            this.view = null;
            this.graphicsLayer = null;
            this.activeToolType = null;
            this.isInitialized = false;

            console.log('Application destroyed successfully');
        } catch (error) {
            console.error('Error destroying application:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const app = new App();
