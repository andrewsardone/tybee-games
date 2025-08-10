import { FC } from 'hono/jsx';

interface LayoutProps {
  children: any;
  title?: string;
}

const Layout: FC<LayoutProps> = ({ children, title = 'Tybee Games' }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <script src="/static/dist/htmx.min.js"></script>
        <style>
          {`
            body {
              font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f7;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            /* Header styling */
            .site-header {
              background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
              border-radius: 16px;
              margin-bottom: 30px;
              box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
              overflow: hidden;
            }
            .header-content {
              display: flex;
              align-items: center;
              padding: 24px 32px;
              gap: 20px;
            }
            .logo {
              width: 64px;
              height: 64px;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              background: white;
              padding: 4px;
            }
            .header-text {
              flex: 1;
            }
            .header-text h1 {
              margin: 0 0 4px 0;
              color: white;
              font-size: 28px;
              font-weight: 700;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }
            .tagline {
              margin: 0;
              color: rgba(255, 255, 255, 0.9);
              font-size: 16px;
              font-weight: 400;
            }
            .games-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
              gap: 20px;
            }
            .game-card {
              background: white;
              border-radius: 12px;
              padding: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              transition: transform 0.2s ease;
              display: flex;
              flex-direction: column;
            }
            .game-card:hover {
              transform: translateY(-2px);
            }
            
            /* Enhanced game card layout */
            .game-image {
              margin-bottom: 16px;
            }
            .game-image img {
              width: 100%;
              height: 150px;
              object-fit: cover;
              border-radius: 8px;
              background: #f5f5f7;
            }
            .game-placeholder {
              width: 100%;
              height: 150px;
              background: #f5f5f7;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: #86868b;
            }
            .game-placeholder span {
              font-size: 32px;
              margin-bottom: 8px;
            }
            .game-placeholder small {
              font-size: 12px;
            }
            .game-content {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .game-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 4px;
              color: #1d1d1f;
            }
            .game-year {
              font-size: 14px;
              color: #86868b;
              margin-bottom: 8px;
            }
            .game-description {
              color: #86868b;
              font-size: 14px;
              line-height: 1.4;
              margin-bottom: 12px;
              flex: 1;
            }
            .game-meta {
              font-size: 12px;
              color: #86868b;
              margin-bottom: 8px;
            }
            .game-categories {
              margin-bottom: 12px;
            }
            .category-tag {
              display: inline-block;
              background: #f2f2f7;
              color: #1d1d1f;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              margin-right: 6px;
              margin-bottom: 4px;
            }
            .game-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: auto;
            }
            .game-rating {
              font-size: 12px;
              color: #86868b;
              font-weight: 500;
            }
            .enrichment-status {
              margin-top: 8px;
              text-align: center;
            }
            .enrichment-status small {
              color: #86868b;
              font-style: italic;
            }
            .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 16px;
              font-size: 12px;
              font-weight: 500;
            }
            .available {
              background-color: #d1f2eb;
              color: #00845a;
            }
            .borrowed {
              background-color: #ffe6e6;
              color: #d73502;
            }
            
            /* Filter form styling */
            .filters {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .filter-row {
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
              align-items: end;
            }
            .filter-group {
              flex: 1;
              min-width: 150px;
            }
            .filter-group label {
              display: block;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 5px;
              color: #1d1d1f;
            }
            .filter-group select,
            .filter-group input {
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #d2d2d7;
              border-radius: 8px;
              font-size: 14px;
              background: white;
            }
            .filter-group select:focus,
            .filter-group input:focus {
              outline: none;
              border-color: #007aff;
            }
            .clear-filters {
              background: #f2f2f7;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
              color: #007aff;
            }
            .results-count {
              font-size: 14px;
              color: #86868b;
              margin-bottom: 15px;
            }
            .error {
              background: #ffe6e6;
              color: #d73502;
              padding: 16px;
              border-radius: 8px;
              text-align: center;
            }
            
            /* Home page styles */
            .home-paths {
              display: grid;
              grid-template-columns: 1fr;
              gap: 24px;
              margin-bottom: 40px;
            }
            .path-card {
              background: white;
              border-radius: 16px;
              padding: 32px;
              text-align: center;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .path-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
            }
            .path-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            .path-card h2 {
              font-size: 24px;
              font-weight: 700;
              margin: 0 0 12px 0;
              color: #1d1d1f;
            }
            .path-card p {
              font-size: 16px;
              color: #86868b;
              margin: 0 0 24px 0;
              line-height: 1.5;
            }
            .path-button {
              padding: 12px 32px;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              min-width: 160px;
            }
            .path-button.primary {
              background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
              color: white;
            }
            .path-button.primary:hover {
              background: linear-gradient(135deg, #357abd 0%, #2968a3 100%);
              transform: translateY(-1px);
            }
            .path-button.secondary {
              background: #f2f2f7;
              color: #1d1d1f;
              border: 2px solid #d2d2d7;
            }
            .path-button.secondary:hover {
              background: #e8e8ed;
              border-color: #b8b8bd;
              transform: translateY(-1px);
            }
            .home-stats {
              background: white;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              font-size: 14px;
              color: #86868b;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-item strong {
              display: block;
              font-size: 24px;
              font-weight: 700;
              color: #1d1d1f;
              margin-bottom: 4px;
            }
            .stat-item span {
              font-size: 12px;
              color: #86868b;
            }
            
            /* Placeholder content */
            .placeholder-content {
              background: white;
              border-radius: 12px;
              padding: 32px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .placeholder-content p {
              font-size: 16px;
              color: #86868b;
              margin-bottom: 20px;
            }
            .placeholder-content ol {
              text-align: left;
              max-width: 400px;
              margin: 0 auto;
              font-size: 14px;
              color: #1d1d1f;
            }
            .placeholder-content li {
              margin-bottom: 8px;
            }
            
            /* Page header styles */
            .page-header {
              margin-bottom: 30px;
            }
            .back-button {
              background: #f2f2f7;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
              color: #007aff;
              margin-bottom: 16px;
              transition: background 0.2s ease;
            }
            .back-button:hover {
              background: #e8e8ed;
            }
            .page-header h1 {
              font-size: 32px;
              font-weight: 700;
              margin: 0 0 8px 0;
              color: #1d1d1f;
            }
            .page-header p {
              font-size: 16px;
              color: #86868b;
              margin: 0;
            }
            
            /* Loading skeleton styles */
            .loading-skeleton {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
              gap: 20px;
            }
            .skeleton-card {
              background: white;
              border-radius: 12px;
              padding: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              height: 300px;
              position: relative;
              overflow: hidden;
            }
            .skeleton-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.4),
                transparent
              );
              animation: skeleton-loading 1.5s infinite;
            }
            @keyframes skeleton-loading {
              0% { left: -100%; }
              100% { left: 100%; }
            }
            
            /* Loading indicator styles */
            .loading-indicator {
              display: none;
              align-items: center;
              justify-content: center;
              gap: 12px;
              padding: 40px;
              text-align: center;
              color: #86868b;
            }
            .loading-indicator.htmx-indicator {
              display: flex;
            }
            .loading-spinner {
              width: 20px;
              height: 20px;
              border: 2px solid #f3f3f3;
              border-top: 2px solid #4a90e2;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            /* View transition styles */
            @view-transition {
              navigation: auto;
            }
            
            /* Transition names for smooth navigation */
            .site-header {
              view-transition-name: site-header;
            }
            .home-paths {
              view-transition-name: home-paths;
            }
            .page-header {
              view-transition-name: page-header;
            }
            .games-grid {
              view-transition-name: games-grid;
            }
            .filters {
              view-transition-name: filters;
            }
            
            /* Transition animations */
            ::view-transition-old(root) {
              animation: slide-out-left 0.3s ease-in-out;
            }
            ::view-transition-new(root) {
              animation: slide-in-right 0.3s ease-in-out;
            }
            
            @keyframes slide-out-left {
              to { transform: translateX(-100%); }
            }
            @keyframes slide-in-right {
              from { transform: translateX(100%); }
            }
            
            /* Fade transitions for content areas */
            ::view-transition-old(games-grid),
            ::view-transition-old(home-paths) {
              animation: fade-out 0.2s ease-in-out;
            }
            ::view-transition-new(games-grid),
            ::view-transition-new(home-paths) {
              animation: fade-in 0.2s ease-in-out;
            }
            
            @keyframes fade-out {
              to { opacity: 0; }
            }
            @keyframes fade-in {
              from { opacity: 0; }
            }
            
            /* Mobile optimizations */
            @media (max-width: 767px) {
              .header-content {
                padding: 20px;
                gap: 16px;
              }
              .logo {
                width: 48px;
                height: 48px;
              }
              .header-text h1 {
                font-size: 24px;
              }
              .tagline {
                font-size: 14px;
              }
            }
            
            /* iPad optimizations */
            @media (min-width: 768px) {
              body {
                padding: 40px;
              }
              .container {
                max-width: 1000px;
              }
              .games-grid {
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              }
              .header-content {
                padding: 32px 40px;
              }
              .logo {
                width: 72px;
                height: 72px;
              }
              .header-text h1 {
                font-size: 32px;
              }
              .tagline {
                font-size: 18px;
              }
              .home-paths {
                grid-template-columns: 1fr 1fr;
                gap: 32px;
              }
              .path-card {
                padding: 40px;
              }
              .path-icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              .path-card h2 {
                font-size: 28px;
              }
              .path-card p {
                font-size: 18px;
              }
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
};

export default Layout;
