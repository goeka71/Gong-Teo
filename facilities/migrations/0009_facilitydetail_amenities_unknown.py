from django.db import migrations


def false_to_unknown(apps, schema_editor):
    """기존 shower/parking 의 False 는 실제 조사값이 아니라 CSV 플레이스홀더였다.

    '없음' 과 '미확인' 을 구분할 수 있게 됐으므로 전부 NULL(미확인) 로 옮긴다.
    """
    FacilityDetail = apps.get_model("facilities", "FacilityDetail")
    FacilityDetail.objects.filter(shower=False).update(shower=None)
    FacilityDetail.objects.filter(parking=False).update(parking=None)


def unknown_to_false(apps, schema_editor):
    FacilityDetail = apps.get_model("facilities", "FacilityDetail")
    FacilityDetail.objects.filter(shower=None).update(shower=False)
    FacilityDetail.objects.filter(parking=None).update(parking=False)


class Migration(migrations.Migration):

    dependencies = [
        ("facilities", "0008_alter_facilitydetail_parking_and_more"),
    ]

    operations = [
        migrations.RunPython(false_to_unknown, unknown_to_false),
    ]
