import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        {/* Outer Yellow Border */}
        <div
          style={{
            display: 'flex',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2.5px solid #fbaa19',
            padding: '1px',
          }}
        >
          {/* Inner Black Border & Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid black',
              overflow: 'hidden',
            }}
          >
            {/* Top Half Yellow */}
            <div
              style={{
                width: '100%',
                height: '50%',
                backgroundColor: '#fbaa19',
              }}
            />
            {/* Bottom Half Black */}
            <div
              style={{
                width: '100%',
                height: '50%',
                backgroundColor: '#000000',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
