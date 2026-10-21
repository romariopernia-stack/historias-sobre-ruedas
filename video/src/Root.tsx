import React from 'react';
import {Composition, Still} from 'remotion';
import {Portada, PORTADAS} from './portada';
import {FPS, H, W} from './brand';
import {Story, StoryData} from './Video';
import all from './stories';

const stories = all as unknown as StoryData[];

export const Root: React.FC = () => (
  <>
    {Object.keys(PORTADAS).map((slug) => (
      <Still key={'p' + slug} id={`portada-${slug}`} component={Portada} width={W} height={H} defaultProps={{slug}} />
    ))}
    {stories.map((d) => (
      <Composition
        key={d.slug}
        id={d.slug}
        component={Story}
        durationInFrames={Math.ceil(d.duration * FPS)}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{data: d}}
      />
    ))}
  </>
);
