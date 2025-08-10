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
