import { useEffect } from "react";
import { observer } from "mobx-react";
import { useStore } from "../../Stores/RootStore";
import { ContoursController } from "../../Map/Controllers/ContoursController";

const ContoursTool = observer(({ active }: { active: boolean }) => {
  const { mapStore } = useStore();
  const controller = mapStore.mapControllers
    .find(c => c instanceof ContoursController);

  if (!controller)
    throw Error("Controller not registered in MapStore");

  useEffect(() => {
    controller.setActive(true);

    return () => {
      controller.setActive(false);
    }
  }, [controller]);

  return active && (
    <> 
      <div className="placeholder" >
        No control elements in demo
      </div>
    </>
  )
});

export default ContoursTool;
