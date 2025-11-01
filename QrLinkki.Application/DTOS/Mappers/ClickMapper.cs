using QrLinkki.Domain.Entities;

namespace QrLinkki.Application.DTOS.Mappers;

public static class ClickMapper
{
    public static ClickDto ToDto(this Click click)
    {
        return new ClickDto
        {
            clicked_at = click.ClickedAt,
            device_info = click.DeviceInfo,
            ip_address = click.IpAddress
        };
    }
    public static Click ToEntity(this ClickDto clickDto)
    {
        return new Click
        {
            ClickedAt = clickDto.clicked_at,
            DeviceInfo = clickDto.device_info,
            IpAddress = clickDto.ip_address
        };
    }
}
