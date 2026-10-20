import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from './brand';
import {Story, StoryData} from './Video';
import all from './stories';

const stories = all as unknown as StoryData[];

export const Root: React.FC = () => (
  <>
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
