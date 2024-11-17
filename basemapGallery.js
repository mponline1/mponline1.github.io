import { BasemapGallery } from '@arcgis/core/widgets/BasemapGallery';
import { Basemap } from '@arcgis/core/Basemap';

export class BasemapGalleryPanel {
  constructor(view) {
    this.view = view;
    this.panel = document.getElementById('basemapGalleryPanel');
    this.gallery = null;
  }

  initialize() {
    // Create basemap gallery widget
    this.gallery = new BasemapGallery({
      view: this.view,
      container: document.createElement("div"),
      source: {
        portal: {
          url: "https://www.arcgis.com",
          useVectorBasemaps: true
        }
      }
    });

    // Add gallery to panel
    const galleryDiv = this.panel.querySelector('#basemapGalleryDiv');
    galleryDiv.appendChild(this.gallery.container);

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close button handler
    const closeBtn = this.panel.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      this.togglePanel();
    });

    // Basemap selection handler
    this.gallery.watch('activeBasemap', (basemap) => {
      this.handleBasemapChange(basemap);
    });
  }

  handleBasemapChange(basemap) {
    // You can add custom logic here when basemap changes
    console.log('Basemap changed to:', basemap.title);
  }

  addCustomBasemap(basemapConfig) {
    const customBasemap = new Basemap(basemapConfig);
    this.gallery.source.basemaps.add(customBasemap);
  }

  removeCustomBasemap(basemapId) {
    const basemap = this.gallery.source.basemaps.find(b => b.id === basemapId);
    if (basemap) {
      this.gallery.source.basemaps.remove(basemap);
    }
  }

  togglePanel() {
    this.panel.classList.toggle('active');
  }
}
