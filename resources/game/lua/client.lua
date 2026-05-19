 function getStateValue(entityId, key)
    if not entityId then
        return nil
    end
    return Entity(entityId).state[key]
end

exports('getStateValue', getStateValue)

function getChildEntity(entityId, name)
  if not entityId then
    return nil
  end
  local childEntityId = getStateValue(entityId, name)
  if childEntityId then
    return childEntityId
  end
  local childNetId = getStateValue(entityId, name .. 'NetId')
  if childNetId then
    childEntityId = NetworkGetEntityFromNetworkId(childNetId)
    Entity(entityId).state.set(name, childEntityId, false)
    return childEntityId
  end
end

exports('getChildEntity', getChildEntity)

function setPedFaceFeature(ped, index, scale)
    SetPedFaceFeature(ped, index, scale + 0.0)
end

exports('setPedFaceFeature', setPedFaceFeature)

function makeHorseMale(horsePed)
    SetPedFaceFeature(horsePed, 0xa28b, 0.0);
    Wait(10);
    Citizen.InvokeNative(0x704c908e9c405136, horsePed);
    Wait(10);
    UpdatePedVariation(horsePed, false, true, true, true, false);
end

exports('makeHorseMale', makeHorseMale)

function makeHorseFemale(horsePed)
    SetPedFaceFeature(horsePed, 0xa28b, 1.0);
    Wait(10);
    Citizen.InvokeNative(0x704c908e9c405136, horsePed);
    Wait(10);
    UpdatePedVariation(horsePed, false, true, true, true, false);
end

exports('makeHorseFemale', makeHorseFemale)
