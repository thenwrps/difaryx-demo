import { Composition, registerRoot } from "remotion";
import { GoogleAIChallengeVideo } from "./GoogleAIChallengeVideo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="GoogleAIChallengeVideo"
      component={GoogleAIChallengeVideo}
      durationInFrames={1800}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

registerRoot(RemotionRoot);
