from django.db import migrations


def fix_missing_colon(apps, schema_editor):
    """"http//example.com" -> "http://example.com".

    website 가 URLField 였을 때는 이런 값이 애초에 저장될 수 없었어야 하지만,
    import_data.py 가 검증 없이 직접 DB에 넣어서 콜론이 빠진 채 들어간 3건이 있다.
    스킴에 콜론만 채워 넣을 뿐, 도메인 철자 자체는 건드리지 않는다
    (예: "gnagnam" 이 "gangnam" 오타로 보이지만, 실제 시설 담당자가 확인해야 할
    내용이라 여기서 임의로 고치지 않는다).
    """
    FacilityDetail = apps.get_model("facilities", "FacilityDetail")
    for prefix in ("http//", "https//"):
        for detail in FacilityDetail.objects.filter(website__startswith=prefix):
            fixed = prefix.replace("//", "://", 1) + detail.website[len(prefix):]
            detail.website = fixed
            detail.save(update_fields=["website"])


class Migration(migrations.Migration):

    dependencies = [
        ("facilities", "0011_alter_facilitydetail_website"),
    ]

    operations = [
        # 오타 수정이라 되돌릴 이유가 없고, 무엇보다 "http://" 로 시작하는 다른
        # (원래 멀쩡했던) 값까지 잘못 되돌릴 위험이 있어 역방향은 noop 으로 둔다.
        migrations.RunPython(fix_missing_colon, migrations.RunPython.noop),
    ]
