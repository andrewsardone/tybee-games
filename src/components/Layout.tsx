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
            h1 {
              text-align: center;
              color: #1d1d1f;
              margin-bottom: 30px;
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
            }
            .game-card:hover {
              transform: translateY(-2px);
            }
            .game-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 8px;
              color: #1d1d1f;
            }
            .game-description {
              color: #86868b;
              font-size: 14px;
              line-height: 1.4;
            }
            .game-meta {
              margin-top: 12px;
              font-size: 12px;
              color: #86868b;
            }
            .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 16px;
              font-size: 12px;
              font-weight: 500;
              margin-top: 12px;
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
