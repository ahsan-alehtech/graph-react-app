# Frontend Graph Visualization

A modern React application for visualizing microservices architecture using interactive graph components. Built with React Flow for optimal performance and future CRUD operations.

## 🚀 Features

- **Interactive Graph Visualization** - Drag, zoom, and explore microservices architecture
- **Circular Node Design** - Clean, modern circular nodes with color coding
- **Curved Bezier Edges** - Graph-like curved connections that avoid overlapping
- **Theme Support** - Light and dark theme toggle
- **Responsive Layout** - Works on different screen sizes
- **Selection Details** - Click nodes/edges to view detailed information
- **Mini Map & Controls** - Built-in navigation and overview
- **CRUD Ready** - Prepared for future add/edit/delete node functionality

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **React Flow** - Professional graph visualization library
- **Vite** - Fast build tool and dev server
- **JavaScript ES6+** - Modern JavaScript features

## 📊 Current Data Structure

The application visualizes a simplified microservices architecture:

### Services (Blue Circles)
- `api-gateway` - Main entry point
- `users` - User management service
- `orders` - Order processing service
- `payments` - Payment handling service
- `notifications` - Notification service

### Databases (Purple Circles)
- `database` - Main database
- `cache` - Caching layer

## 🎯 Graph Layout

Nodes are strategically positioned in a graph-like layout:
- **API Gateway** at the top (entry point)
- **Services** arranged in a circular pattern
- **Databases** at the bottom (data layer)
- **Curved edges** show data flow between components

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone git@github.com:renjithraj2005/fe-graph.git
cd fe-graph

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── App.jsx                 # Main app component with routing
├── FlowTab.jsx            # React Flow graph visualization
├── FeatureSetGraphOTel.jsx # Alternative graph implementation
├── main.jsx               # App entry point
└── data/
    └── serviceGraphData.json # Graph data (nodes & edges)
```

## 🎨 Customization

### Adding New Nodes
Edit `src/data/serviceGraphData.json`:

```json
{
  "nodes": [
    { "id": "new-service", "kind": "service" }
  ],
  "edges": [
    { "source": "api-gateway", "target": "new-service", "rps": 100, "errorRate": 0.001, "p95ms": 30 }
  ]
}
```

### Styling Nodes
Modify the node styles in `FlowTab.jsx`:

```javascript
style: {
  background: node.kind === 'database' ? '#7c3aed' : '#2563eb',
  // ... other styles
}
```

## 🔮 Future Enhancements

- **Add Node Functionality** - Create new services/databases
- **Edit Node Properties** - Modify node details inline
- **Delete Nodes** - Remove nodes with confirmation
- **Drag & Drop Connections** - Create edges by dragging
- **Export/Import** - Save and load graph configurations
- **Real-time Data** - Connect to live microservices metrics
- **Advanced Layouts** - Multiple layout algorithms
- **Node Templates** - Predefined service types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) - Excellent graph visualization library
- [Vite](https://vitejs.dev/) - Fast and modern build tool
- [React](https://reactjs.org/) - UI library

---

**Happy coding!** 🚀
